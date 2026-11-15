import type { OAuthClientInput, SourceConfig, SourceKind, SourceView } from "@runelay/shared";
import type { SourceDraft } from "@/modules/sources/schemas/source-draft.schema";
import { formatKeyValueLines } from "@/modules/sources/utils/key-value-lines";

const EMPTY_DRAFT: SourceDraft = {
  kind: "mcp",
  url: "",
  command: "",
  spec: "",
  baseUrl: "",
  headers: "",
  env: "",
  oauthClientId: "",
  oauthClientSecret: "",
};

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

export const draftFromSource = (source: SourceView): SourceDraft => ({
  ...draftFromConfig(source.config),
  oauthClientId: source.oauthClientId ?? "",
});

export const oauthClientFromDraft = (draft: SourceDraft): OAuthClientInput | undefined => {
  const clientId = draft.oauthClientId.trim();
  const clientSecret = draft.oauthClientSecret.trim();
  if (draft.kind !== "mcp" || !clientId) return undefined;
  return { clientId, ...(clientSecret ? { clientSecret } : {}) };
};

export const oauthClientChange = (draft: SourceDraft, current: string | null): OAuthClientInput | null | undefined => {
  const next = oauthClientFromDraft(draft);
  if (!next) return current ? null : undefined;
  return next.clientId === current && !next.clientSecret ? undefined : next;
};
