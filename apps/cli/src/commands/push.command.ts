import { type ImportResultView, ok, type Result } from "@runelay/shared";
import { plural } from "@/lib/format";
import { printJson, wantsJson } from "@/lib/json-output";
import { formatNote, formatRow, printCard, startStep } from "@/lib/ui";
import { resolveConnection } from "@/services/config.service";
import { collectContext } from "@/services/context-collector.service";
import { pushContext } from "@/services/context-push.service";
import { recordLastPush } from "@/services/push-state.service";
import type { CollectLine } from "@/types/collect.types";
import type { Connection } from "@/types/config.types";
import type { PushReport } from "@/types/json-report.types";

const describeAgent = (lines: CollectLine[]) => {
  const total = (kind: CollectLine["kind"]) =>
    lines.filter((line) => line.kind === kind).reduce((sum, line) => sum + line.added, 0);
  const repeated = lines.reduce((sum, line) => sum + line.found - line.added, 0);
  return [
    total("memories") ? plural(total("memories"), "memory", "memories") : "",
    total("skills") ? plural(total("skills"), "skill", "skills") : "",
    lines.some((line) => line.kind === "instructions") ? "instructions" : "",
    repeated ? `${repeated} repeated` : "",
  ]
    .filter(Boolean)
    .join(" · ");
};

export const describePushCounts = ({ written, unchanged, skipped }: ImportResultView) =>
  `${written} sent · ${unchanged.length} unchanged · ${skipped.length} skipped`;

export const runPush = async (connection: Connection) => {
  const read = startStep("Reading your agents");
  const { memories, skills, lines } = collectContext();
  for (const agent of new Set(lines.map((line) => line.agent)))
    read.row(
      formatRow({ tone: "ok", name: agent, message: describeAgent(lines.filter((line) => line.agent === agent)) }),
    );
  const pinned = memories.filter((memory) => memory.pinned).length;
  read.done(
    `${plural(memories.length, "memory", "memories")} (${pinned} pinned) · ${plural(skills.length, "skill", "skills")}`,
  );

  const send = startStep("Sending to runelay");
  const pushed = await pushContext(connection, memories, skills);
  if (pushed.error) {
    send.fail(pushed.error.message);
    return pushed;
  }
  recordLastPush();
  const skipped = [...pushed.data.memories.skipped, ...pushed.data.skills.skipped];
  if (skipped.length) {
    send.row(formatNote(`newer on the server, kept: ${skipped.join(", ")}`));
    send.warn(`${skipped.length} skipped because the server copy is newer`);
  } else send.done(`${pushed.data.memories.written + pushed.data.skills.written} sent`);
  return ok(pushed.data);
};

export const pushCommand = async (args: string[] = []): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const pushed = await runPush(connection.data);
  if (pushed.error) return pushed;
  const { memories, skills } = pushed.data;
  if (wantsJson(args)) {
    printJson({
      command: "push",
      ok: true,
      imported: { memories: memories.written, skills: skills.written },
      unchanged: { memories: memories.unchanged, skills: skills.unchanged },
      skipped: { memories: memories.skipped, skills: skills.skipped },
    } satisfies PushReport);
  }
  const skipped = memories.skipped.length + skills.skipped.length;
  printCard({
    title: "Pushed",
    stats: [
      ["Memories", describePushCounts(memories)],
      ["Skills", describePushCounts(skills)],
    ],
    next: skipped ? "runelay pull, to bring the newer server copies down" : "runelay pull",
  });
  return ok(null);
};
