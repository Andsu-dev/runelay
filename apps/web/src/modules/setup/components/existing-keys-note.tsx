import type { ApiKeyView } from "@runelay/shared";
import { CommandBlock } from "@/components/ui/display/command-block";
import { formatDate } from "@/lib/format";

interface ExistingKeysNoteProps {
  latest: ApiKeyView | null;
  apiKey: string | null;
}

export function ExistingKeysNote({ latest, apiKey }: ExistingKeysNoteProps) {
  if (apiKey) {
    return (
      <div className="flex flex-col gap-1.5">
        {latest && (
          <span className="text-xs text-muted-foreground">
            {latest.name ?? "Sem nome"}, criada em {formatDate(latest.createdAt)}
          </span>
        )}
        <CommandBlock value={apiKey} secret={apiKey} label="Copiar chave" />
      </div>
    );
  }
  if (!latest) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5 text-[13px]">
      <span>
        A chave <span className="font-medium">{latest.name ?? "sem nome"}</span>{" "}
        <code className="font-mono text-xs text-muted-foreground">{latest.start}…</code> foi criada antes do cofre e não
        pode ser recuperada.
      </span>
      <span className="text-xs text-muted-foreground">
        Crie outra: a partir de agora toda chave fica guardada cifrada.
      </span>
    </div>
  );
}
