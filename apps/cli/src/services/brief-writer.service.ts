import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attemptSync, type ContextBriefView, type ContextClient, type Result } from "@runelay/shared";
import {
  briefLeadFor,
  CONTEXT_END_MARKER,
  CONTEXT_START_MARKER,
  INSTRUCTION_TARGETS,
} from "@/constants/context.constants";
import type { InstructionTarget } from "@/types/context.types";

export type BriefStatus = "written" | "unchanged" | "skipped" | "failed";

export interface BriefOutcome {
  target: InstructionTarget;
  status: BriefStatus;
  message: string | null;
  pinnedCount: number;
}

export type BriefFetcher = (client: ContextClient) => Promise<Result<ContextBriefView>>;

export const withBlock = (current: string, markdown: string) => {
  const block = `${CONTEXT_START_MARKER}\n${markdown.trim()}\n${CONTEXT_END_MARKER}`;
  const start = current.indexOf(CONTEXT_START_MARKER);
  const end = current.indexOf(CONTEXT_END_MARKER, start);
  if (start >= 0 && end > start)
    return current.slice(0, start) + block + current.slice(end + CONTEXT_END_MARKER.length);
  return `${current}${current && !current.endsWith("\n") ? "\n" : ""}${current ? "\n" : ""}${block}\n`;
};

export const writeBriefs = async (
  fetchBrief: BriefFetcher,
  targets: InstructionTarget[] = INSTRUCTION_TARGETS,
): Promise<BriefOutcome[]> => {
  const briefs = new Map<ContextClient, Promise<Result<ContextBriefView>>>();
  const briefFor = (client: ContextClient) => {
    const cached = briefs.get(client) ?? fetchBrief(client);
    briefs.set(client, cached);
    return cached;
  };
  const outcomes: BriefOutcome[] = [];
  for (const target of targets) {
    if (!existsSync(target.detect)) {
      outcomes.push({ target, status: "skipped", message: null, pinnedCount: 0 });
      continue;
    }
    const { data, error } = await briefFor(target.client);
    if (error) {
      outcomes.push({ target, status: "failed", message: error.message, pinnedCount: 0 });
      continue;
    }
    const lead = `${briefLeadFor(target.client)}\n\n${data.markdown.trim()}`;
    const written = attemptSync(() => {
      const current = existsSync(target.file) ? readFileSync(target.file, "utf8") : "";
      const next = withBlock(current, lead);
      if (next === current) return false;
      mkdirSync(dirname(target.file), { recursive: true });
      writeFileSync(target.file, next);
      return true;
    }, "STORAGE_FAILED");
    outcomes.push(
      written.error
        ? { target, status: "failed", message: written.error.message, pinnedCount: 0 }
        : { target, status: written.data ? "written" : "unchanged", message: null, pinnedCount: data.pinnedCount },
    );
  }
  return outcomes;
};
