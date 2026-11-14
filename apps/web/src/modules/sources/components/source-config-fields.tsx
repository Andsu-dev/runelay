import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { KIND_HINT } from "@/modules/sources/constants/source.constants";
import type { SourceDraft } from "@/modules/sources/schemas/source-draft.schema";
import { KindSwitch } from "./kind-switch";

interface SourceConfigFieldsProps {
  draft: SourceDraft;
  onChange: (draft: SourceDraft) => void;
  lockKind?: boolean;
}

export function SourceConfigFields({ draft, onChange, lockKind = false }: SourceConfigFieldsProps) {
  const set = (field: keyof SourceDraft) => (value: string) => onChange({ ...draft, [field]: value });

  return (
    <div className="flex flex-col gap-3">
      {!lockKind && <KindSwitch value={draft.kind} onChange={(kind) => onChange({ ...draft, kind })} />}
      <p className="text-xs text-muted-foreground">{KIND_HINT[draft.kind]}</p>

      {draft.kind === "mcp" && (
        <Field label="URL">
          <Input
            value={draft.url}
            onChange={(event) => set("url")(event.target.value)}
            placeholder="https://mcp.linear.app/mcp"
            required
          />
        </Field>
      )}

      {draft.kind === "stdio" && (
        <Field label="Comando">
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
            placeholder="https://api.exemplo.com/openapi.json"
            required
          />
        </Field>
      )}

      {draft.kind === "openapi" && (
        <Field label="Base URL" hint="Opcional. Sem ela, vale a do próprio spec.">
          <Input value={draft.baseUrl} onChange={(event) => set("baseUrl")(event.target.value)} />
        </Field>
      )}

      {draft.kind === "stdio" ? (
        <Field label="Variáveis de ambiente" hint="Uma por linha, CHAVE=valor.">
          <Textarea
            value={draft.env}
            onChange={(event) => set("env")(event.target.value)}
            className="min-h-20 font-mono text-xs"
          />
        </Field>
      ) : (
        <Field label="Headers" hint="Um por linha, Nome: valor. Ficam cifrados.">
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
