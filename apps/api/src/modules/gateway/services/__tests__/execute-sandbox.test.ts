import { describe, expect, test } from "bun:test";
import { fail, ok } from "@runelay/shared";
import { EXECUTE_LIMITS } from "@/modules/gateway/constants/sandbox.constants";
import { runInSandbox } from "@/modules/gateway/sandbox/run-in-sandbox";
import type { ToolNamespace } from "@/modules/gateway/types/gateway.types";
import type { SandboxLimits } from "@/modules/gateway/types/sandbox.types";

const limits: SandboxLimits = { ...EXECUTE_LIMITS, cpuMs: 300, wallMs: 2_000 };

const calls: string[] = [];

const tools: ToolNamespace = {
  github: {
    get_user: async (args) => {
      calls.push(`github.get_user ${JSON.stringify(args)}`);
      return ok({ login: String(args?.login ?? "anon"), id: 7 });
    },
    broken: async () => fail("TOOL_FAILED", "upstream down"),
  },
  linear: {
    create_issue: async (args) => {
      await Bun.sleep(20);
      calls.push(`linear.create_issue ${JSON.stringify(args)}`);
      return ok({ title: args?.title, assignee: args?.assignee });
    },
  },
};

const run = (code: string, overrides: Partial<SandboxLimits> = {}) =>
  runInSandbox(code, tools, { ...limits, ...overrides });

describe("runInSandbox", () => {
  test("returns a value", async () => {
    const result = await run("return { sum: 1 + 2, list: [1, 'a', null] };");
    expect(result).toEqual({ data: { result: { sum: 3, list: [1, "a", null] }, logs: [] }, error: null });
  });

  test("returns undefined when nothing is returned", async () => {
    const result = await run("const a = 1;");
    expect(result.error).toBeNull();
    expect(result.data?.result).toBeUndefined();
  });

  test("chains two awaited tool calls", async () => {
    const result = await run(`
      const user = await tools.github.get_user({ login: "octo" });
      const issue = await tools.linear.create_issue({ title: "hi", assignee: user.data.login });
      return issue;
    `);
    expect(result.data?.result).toEqual({ data: { title: "hi", assignee: "octo" }, error: null });
  });

  test("runs tool calls with Promise.all", async () => {
    const startedAt = performance.now();
    const result = await run(`
      const results = await Promise.all([
        tools.linear.create_issue({ title: "a" }),
        tools.linear.create_issue({ title: "b" }),
        tools.linear.create_issue({ title: "c" }),
      ]);
      return results.map((item) => item.data.title);
    `);
    expect(result.data?.result).toEqual(["a", "b", "c"]);
    expect(performance.now() - startedAt).toBeLessThan(60);
  });

  test("passes tool errors through as data", async () => {
    const result = await run("return await tools.github.broken();");
    expect(result.data?.result).toMatchObject({ data: null, error: { code: "TOOL_FAILED", message: "upstream down" } });
  });

  test("rejects non object tool args without calling the tool", async () => {
    calls.length = 0;
    const result = await run("return await tools.github.get_user([1, 2]);");
    expect(result.data?.result).toMatchObject({ error: { code: "INVALID_INPUT" } });
    expect(calls).toEqual([]);
  });

  test("captures console.log and console.error", async () => {
    const result = await run(`console.log("hello", { a: 1 }, 2); console.error("bad"); return null;`);
    expect(result.data?.logs).toEqual(['hello {"a":1} 2', "bad"]);
  });

  test("blocks the constructor escape to process", async () => {
    const result = await run(`return this.constructor.constructor("return typeof process")();`);
    expect(result.data?.result ?? result.error?.message).not.toBe("object");
    const direct = await run(`return this.constructor.constructor("return process")();`);
    expect(direct.error?.code).toBe("EXECUTE_FAILED");
    expect(direct.error?.message).toContain("process");
  });

  test("exposes no host globals", async () => {
    const result = await run(`
      return [typeof globalThis.process, typeof require, typeof fetch, typeof setTimeout, typeof Bun, typeof module];
    `);
    expect(result.data?.result).toEqual(["undefined", "undefined", "undefined", "undefined", "undefined", "undefined"]);
  });

  test("dynamic import fails", async () => {
    const result = await run(`return await import("node:fs");`);
    expect(result.error?.code).toBe("EXECUTE_FAILED");
  });

  test("tools reach no host object", async () => {
    const result = await run(`
      const fn = tools.github.get_user;
      const escaped = await fn.constructor("return typeof process")();
      return [escaped, Object.isFrozen(tools), typeof console.log.constructor("return this")().process];
    `);
    expect(result.data?.result).toEqual(["undefined", true, "undefined"]);
  });

  test("interrupts an infinite loop within the cpu deadline", async () => {
    const startedAt = performance.now();
    const result = await run("while (true) {}");
    expect(result.error?.code).toBe("EXECUTE_FAILED");
    expect(result.error?.message).toContain("processamento");
    expect(performance.now() - startedAt).toBeLessThan(limits.cpuMs + 500);
  });

  test("interrupts an infinite loop after an awaited tool call", async () => {
    const result = await run("await tools.github.get_user({}); for (;;) {}");
    expect(result.error?.message).toContain("processamento");
  });

  test("hits the memory limit on a huge allocation", async () => {
    const result = await run("const chunks = []; while (true) chunks.push(new Array(1e5).fill(Math.random()));", {
      cpuMs: 5_000,
    });
    expect(result.error?.code).toBe("EXECUTE_FAILED");
    expect(result.error?.message).toContain("memória");
  });

  test("stops deep recursion at the stack limit", async () => {
    const result = await run("const f = (n) => f(n + 1) + 1; return f(0);");
    expect(result.error?.code).toBe("EXECUTE_FAILED");
    expect(result.error?.message).toContain("stack");
  });

  test("returns a thrown error as EXECUTE_FAILED", async () => {
    const result = await run(`throw new TypeError("deu ruim");`);
    expect(result).toMatchObject({ data: null, error: { code: "EXECUTE_FAILED", message: "TypeError: deu ruim" } });
  });

  test("returns a syntax error as EXECUTE_FAILED", async () => {
    const result = await run("return (;");
    expect(result.error?.code).toBe("EXECUTE_FAILED");
    expect(result.error?.message).toContain("SyntaxError");
  });

  test("fails fast when awaiting a promise that never settles", async () => {
    const result = await run("await new Promise(() => {});");
    expect(result.error?.message).toContain("nunca resolve");
  });

  test("enforces the wall clock deadline while waiting on tools", async () => {
    const slow: ToolNamespace = { slow: { wait: () => new Promise(() => {}) } };
    const result = await runInSandbox("await tools.slow.wait();", slow, { ...limits, wallMs: 200 });
    expect(result.error?.message).toContain("execute passou de 0.2s");
  });

  test("describes a thrown primitive and a message-only object", async () => {
    const primitive = await run("}); throw 42; (() => {");
    expect(primitive.error).toMatchObject({ code: "EXECUTE_FAILED", message: "42" });
    const object = await run("}); throw { message: 'plain' }; (() => {");
    expect(object.error?.message).toBe("Error: plain");
  });

  test("returns a host failure inside a slice as EXECUTE_FAILED", async () => {
    const code = {
      toString: () => {
        throw new Error("host boom");
      },
    } as unknown as string;
    const result = await runInSandbox(code, tools, limits);
    expect(result.error).toMatchObject({ code: "EXECUTE_FAILED", message: "host boom" });
  });

  test("reports a missing tool and a tool result that is not JSON", async () => {
    const odd: ToolNamespace = { odd: { bigint: async () => ok(1n) } };
    Object.defineProperty(odd.odd, "gone", { enumerable: true, get: () => undefined });
    const result = await runInSandbox("return [await tools.odd.gone(), await tools.odd.bigint()];", odd, limits);
    expect(result.data?.result).toMatchObject([
      { error: { code: "TOOL_NOT_FOUND", message: "a tool odd.gone não existe" } },
      { error: { code: "TOOL_FAILED", message: "a resposta da tool não é JSON" } },
    ]);
  });

  test("measures one run", async () => {
    await run("return 1;");
    const runs = 20;
    const startedAt = performance.now();
    for (let index = 0; index < runs; index++) await run("return await tools.github.get_user({});");
    console.info(`sandbox run: ${((performance.now() - startedAt) / runs).toFixed(2)}ms`);
  });
});
