import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { useT } from "@/lib/i18n";
import { sourceAuthQuery } from "@/modules/sources/api/sources.api";
import { KIND_HINT } from "@/modules/sources/constants/source.constants";
import type { SourceDraft } from "@/modules/sources/schemas/source-draft.schema";
import { KindSwitch } from "./kind-switch";

interface SourceConfigFieldsProps {
  draft: SourceDraft;
  onChange: (draft: SourceDraft) => void;
  lockKind?: boolean;
}

export function SourceConfigFields({ draft, onChange, lockKind = false }: SourceConfigFieldsProps) {
  const t = useT();
  const set = (field: keyof SourceDraft) => (value: string) => onChange({ ...draft, [field]: value });
  const [probedUrl, setProbedUrl] = useState(draft.url.trim());
  const [headersOpen, setHeadersOpen] = useState(false);
  const isMcp = draft.kind === "mcp";
  const { data: detection } = useQuery(sourceAuthQuery(isMcp ? probedUrl : ""));
  const auth = isMcp && draft.url.trim() === probedUrl ? detection?.auth : undefined;
  const urlHint =
    auth === "oauth" ? t("sources.fields.authOAuth") : auth === "header" ? t("sources.fields.authHeader") : undefined;
  const headersCollapsed = auth === "oauth" && !headersOpen && !draft.headers.trim();

  return (
    <div className="flex flex-col gap-3">
      {!lockKind && <KindSwitch value={draft.kind} onChange={(kind) => onChange({ ...draft, kind })} />}
      <p className="text-xs text-muted-foreground">{t(KIND_HINT[draft.kind])}</p>

      {draft.kind === "mcp" && (
        <Field label="URL" hint={urlHint}>
          <Input
            value={draft.url}
            onChange={(event) => set("url")(event.target.value)}
            onBlur={(event) => setProbedUrl(event.target.value.trim())}
            placeholder="https://mcp.linear.app/mcp"
            required
          />
        </Field>
      )}

      {draft.kind === "stdio" && (
        <Field label={t("sources.fields.command")}>
          <Input
            value={draft.command}
            onChange={(event) => set("command")(event.target.value)}
            placeholder="npx -y @modelcontextprotocol/server-everything"
            required
          />
        </Field>
      )}

      {draft.kind === "openapi" && (
        <Field label="Spec">
          <Input
            value={draft.spec}
            onChange={(event) => set("spec")(event.target.value)}
            placeholder={t("sources.fields.specPlaceholder")}
            required
          />
        </Field>
      )}

      {draft.kind === "openapi" && (
        <Field label="Base URL" hint={t("sources.fields.baseUrlHint")}>
          <Input value={draft.baseUrl} onChange={(event) => set("baseUrl")(event.target.value)} />
        </Field>
      )}

      {draft.kind === "stdio" ? (
        <Field label={t("sources.fields.env")} hint={t("sources.fields.envHint")}>
          <Textarea
            value={draft.env}
            onChange={(event) => set("env")(event.target.value)}
            className="min-h-20 font-mono text-xs"
          />
        </Field>
      ) : headersCollapsed ? (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setHeadersOpen(true)}>
          {t("sources.fields.addHeaders")}
        </Button>
      ) : (
        <Field label="Headers" hint={t("sources.fields.headersHint")}>
          <Textarea
            value={draft.headers}
            onChange={(event) => set("headers")(event.target.value)}
            placeholder="Authorization: Bearer sk-..."
            className="min-h-20 font-mono text-xs"
          />
        </Field>
      )}
    </div>
  );
}
