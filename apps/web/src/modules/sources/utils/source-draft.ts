import type { GoogleConfig, OAuthClientInput, SourceConfig, SourceView } from "@runelay/shared";
import type { DraftKind, SourceDraft } from "@/modules/sources/schemas/source-draft.schema";
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
  oauthClientScopes: "",
};

export const emptyDraft = (kind: DraftKind = "mcp"): SourceDraft => ({ ...EMPTY_DRAFT, kind });

export const draftFromConfig = (config: Exclude<SourceConfig, GoogleConfig>): SourceDraft => {
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

export const draftFromSource = (source: SourceView, config: Exclude<SourceConfig, GoogleConfig>): SourceDraft => ({
  ...draftFromConfig(config),
  oauthClientId: source.oauthClientId ?? "",
  oauthClientScopes: source.oauthClientScopes.join("\n"),
});

type OAuthClientDraft = Pick<SourceDraft, "oauthClientId" | "oauthClientSecret" | "oauthClientScopes">;

export const oauthClientFromFields = (fields: OAuthClientDraft): OAuthClientInput | undefined => {
  const clientId = fields.oauthClientId.trim();
  const clientSecret = fields.oauthClientSecret.trim();
  const scopes = fields.oauthClientScopes.split(/[\s,]+/).filter(Boolean);
  if (!clientId) return undefined;
  return { clientId, ...(clientSecret ? { clientSecret } : {}), ...(scopes.length ? { scopes } : {}) };
};

export const oauthClientFromDraft = (draft: SourceDraft): OAuthClientInput | undefined =>
  draft.kind === "mcp" ? oauthClientFromFields(draft) : undefined;

export const oauthClientChange = (
  draft: SourceDraft,
  current: Pick<SourceView, "oauthClientId" | "oauthClientScopes">,
  next: OAuthClientInput | undefined = oauthClientFromDraft(draft),
): OAuthClientInput | null | undefined => {
  if (!next) return current.oauthClientId ? null : undefined;
  const unchanged =
    next.clientId === current.oauthClientId &&
    !next.clientSecret &&
    (next.scopes ?? []).join(" ") === current.oauthClientScopes.join(" ");
  return unchanged ? undefined : next;
};
