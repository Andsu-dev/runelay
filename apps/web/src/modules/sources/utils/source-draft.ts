import type { SourceConfig, SourceKind } from "@runelay/shared";
import type { SourceDraft } from "@/modules/sources/schemas/source-draft.schema";
import { formatKeyValueLines } from "@/modules/sources/utils/key-value-lines";

const EMPTY_DRAFT: SourceDraft = { kind: "mcp", url: "", command: "", spec: "", baseUrl: "", headers: "", env: "" };

export const emptyDraft = (kind: SourceKind = "mcp"): SourceDraft => ({ ...EMPTY_DRAFT, kind });

export const draftFromConfig = (config: SourceConfig): SourceDraft => {
  if (config.kind === "stdio") {
    return {
      ...EMPTY_DRAFT,
      kind: "stdio",
      command: [config.command, ...config.args].join(" "),
      env: formatKeyValueLines(config.env, "="),
    };
  }
  if (config.kind === "openapi") {
    return {
      ...EMPTY_DRAFT,
      kind: "openapi",
      spec: config.spec,
      baseUrl: config.baseUrl ?? "",
      headers: formatKeyValueLines(config.headers, ": "),
    };
  }
  return { ...EMPTY_DRAFT, url: config.url, headers: formatKeyValueLines(config.headers, ": ") };
};
