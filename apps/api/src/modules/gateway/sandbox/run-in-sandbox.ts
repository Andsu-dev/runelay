import wasmPath from "@jitl/quickjs-wasmfile-release-sync/wasm" with { type: "file" };
import { attempt, attemptSync, errorMessage, fail, ok, type Result } from "@runelay/shared";
import {
  newQuickJSWASMModule,
  newVariant,
  type QuickJSDeferredPromise,
  type QuickJSHandle,
  RELEASE_SYNC,
} from "quickjs-emscripten";
import type { ToolArgs } from "@/modules/connectors/types/connector.types";
import {
  SANDBOX_FILENAME,
  SANDBOX_MESSAGES,
  SANDBOX_PRELUDE,
  SANDBOX_RUNNER,
} from "@/modules/gateway/constants/sandbox.constants";
import type { ExecuteOutput, ToolNamespace } from "@/modules/gateway/types/gateway.types";
import type { SandboxLimits, SandboxStop } from "@/modules/gateway/types/sandbox.types";

let quickjsModule: Promise<WebAssembly.Module> | undefined;

const compileQuickJS = () => {
  quickjsModule ??= Bun.file(wasmPath)
    .arrayBuffer()
    .then((bytes) => WebAssembly.compile(bytes));
  return quickjsModule;
};

const parseToolArgs = (text: string): ToolArgs | null => {
  const parsed = attemptSync(() => JSON.parse(text) as unknown, "INVALID_INPUT");
  if (parsed.error) return null;
  const value = parsed.data;
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as ToolArgs) : null;
};

const callTool = async (tools: ToolNamespace, source: string, name: string, argsText: string): Promise<string> => {
  const tool =
    Object.hasOwn(tools, source) && Object.hasOwn(tools[source] ?? {}, name) ? tools[source]?.[name] : undefined;
  if (!tool) return JSON.stringify(fail("TOOL_NOT_FOUND", SANDBOX_MESSAGES.missingTool(source, name)));
  const args = parseToolArgs(argsText);
  if (!args) return JSON.stringify(fail("INVALID_INPUT", SANDBOX_MESSAGES.invalidArgs));
  const called = await attempt(() => tool(args), "TOOL_FAILED");
  const serialized = attemptSync(() => JSON.stringify(called.error ? called : called.data), "TOOL_FAILED");
  return serialized.data ?? JSON.stringify(fail("TOOL_FAILED", SANDBOX_MESSAGES.invalidToolResult));
};

const describeGuestError = (value: unknown) => {
  if (typeof value === "object" && value !== null && "message" in value) {
    const name = "name" in value ? String(value.name) : "Error";
    return `${name}: ${String(value.message)}`;
  }
  return String(value);
};

export const runInSandbox = async (
  code: string,
  tools: ToolNamespace,
  limits: SandboxLimits,
): Promise<Result<ExecuteOutput>> => {
  const quickjs = await newQuickJSWASMModule(newVariant(RELEASE_SYNC, { wasmModule: compileQuickJS }));
  const runtime = quickjs.newRuntime();
  const context = runtime.newContext();
  const startedAt = performance.now();
  const logs: string[] = [];
  const pending = new Set<QuickJSDeferredPromise>();
  const outcome = Promise.withResolvers<Result<ExecuteOutput>>();
  let logChars = 0;
  let cpuUsedMs = 0;
  let sliceStartedAt: number | null = null;
  let stop: SandboxStop | null = null;
  let finished = false;

  const finish = (result: Result<ExecuteOutput>) => {
    if (finished) return;
    finished = true;
    outcome.resolve(result);
  };

  const describeFailure = (message: string) => {
    if (stop === "cpu") return SANDBOX_MESSAGES.cpu(limits);
    if (stop === "wall") return SANDBOX_MESSAGES.wall(limits);
    if (/out of memory/i.test(message)) return SANDBOX_MESSAGES.memory(limits);
    return message;
  };

  const failWith = (message: string) => finish(fail("EXECUTE_FAILED", describeFailure(message)));

  const failFromGuest = (handle: QuickJSHandle) => {
    const value = context.dump(handle);
    handle.dispose();
    failWith(describeGuestError(value));
  };

  const runSlice = (slice: () => void) => {
    if (finished) return;
    sliceStartedAt = performance.now();
    try {
      slice();
    } catch (error) {
      failWith(errorMessage(error));
    } finally {
      cpuUsedMs += performance.now() - sliceStartedAt;
      sliceStartedAt = null;
    }
  };

  const drain = () => {
    runSlice(() => {
      const jobs = runtime.executePendingJobs();
      if (jobs.error) failFromGuest(jobs.error);
    });
    if (!finished && pending.size === 0) failWith(SANDBOX_MESSAGES.stalled);
  };

  const invoke = (source: string, args: QuickJSHandle[]) => {
    const evaluated = context.evalCode(source, SANDBOX_FILENAME);
    if (evaluated.error) return failFromGuest(evaluated.error);
    const called = evaluated.value.consume((fn) => context.callFunction(fn, context.undefined, args));
    if (called.error) return failFromGuest(called.error);
    called.value.dispose();
  };

  runtime.setMemoryLimit(limits.memoryBytes);
  runtime.setMaxStackSize(limits.maxStackBytes);
  runtime.setInterruptHandler(() => {
    const now = performance.now();
    if (now - startedAt > limits.wallMs) stop = "wall";
    else if (sliceStartedAt !== null && cpuUsedMs + now - sliceStartedAt > limits.cpuMs) stop = "cpu";
    return stop !== null;
  });

  let wallTimer: ReturnType<typeof setTimeout> | undefined;
  const hostHandles: QuickJSHandle[] = [];
  try {
    const callHandle = context.newFunction("call", (sourceHandle, nameHandle, argsHandle) => {
      const source = context.getString(sourceHandle);
      const name = context.getString(nameHandle);
      const argsText = context.getString(argsHandle);
      const deferred = context.newPromise();
      pending.add(deferred);
      const request = callTool(tools, source, name, argsText);
      request.then((text) => {
        pending.delete(deferred);
        if (finished) return deferred.dispose();
        runSlice(() => {
          const value = context.newString(text);
          deferred.resolve(value);
          value.dispose();
        });
        drain();
      });
      return deferred.handle;
    });

    const logHandle = context.newFunction("log", (textHandle) => {
      if (logChars >= limits.maxLogChars) return;
      const text = context.getString(textHandle).slice(0, limits.maxLogChars - logChars);
      logChars += text.length;
      logs.push(text);
    });

    const doneHandle = context.newFunction("done", (valueHandle) => {
      if (context.typeof(valueHandle) !== "string") return finish(ok({ result: undefined, logs }));
      const parsed = attemptSync(() => JSON.parse(context.getString(valueHandle)) as unknown, "EXECUTE_FAILED");
      if (parsed.error) return failWith(SANDBOX_MESSAGES.invalidResult);
      finish(ok({ result: parsed.data, logs }));
    });

    const failedHandle = context.newFunction("failed", (messageHandle) => failWith(context.getString(messageHandle)));
    hostHandles.push(callHandle, logHandle, doneHandle, failedHandle);

    const manifest = Object.fromEntries(
      Object.entries(tools).map(([source, entries]) => [source, Object.keys(entries)]),
    );
    const manifestHandle = context.newString(JSON.stringify(manifest));

    hostHandles.push(manifestHandle);
    runSlice(() => {
      invoke(SANDBOX_PRELUDE, [callHandle, logHandle, manifestHandle]);
      if (finished) return;
      const compiled = context.evalCode(`(async () => {\n${code}\n})`, SANDBOX_FILENAME);
      if (compiled.error) return failFromGuest(compiled.error);
      compiled.value.consume((run) => invoke(SANDBOX_RUNNER, [run, doneHandle, failedHandle]));
    });
    for (const handle of hostHandles) handle.dispose();
    drain();

    wallTimer = setTimeout(
      () => failWith(SANDBOX_MESSAGES.wall(limits)),
      Math.max(0, limits.wallMs - (performance.now() - startedAt)),
    );
    return await outcome.promise;
  } catch (error) {
    return fail("EXECUTE_FAILED", describeFailure(errorMessage(error)));
  } finally {
    finished = true;
    clearTimeout(wallTimer);
    for (const handle of hostHandles) if (handle.alive) handle.dispose();
    for (const deferred of pending) deferred.dispose();
    pending.clear();
    if (context.alive) context.dispose();
    if (runtime.alive) runtime.dispose();
  }
};
