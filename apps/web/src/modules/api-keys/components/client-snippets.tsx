import { CommandBlock } from "@/components/ui/display/command-block";
import { CLIENT_SNIPPETS } from "@/modules/api-keys/constants/client-snippets.constants";

interface ClientSnippetsProps {
  apiKey: string;
}

export function ClientSnippets({ apiKey }: ClientSnippetsProps) {
  const url = `${window.location.origin}/v1/mcp`;

  return (
    <div className="flex flex-col gap-3">
      {CLIENT_SNIPPETS.map(({ client, file, build }) => {
        const snippet = build(url, apiKey);
        return (
          <div key={client} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{client}</span>
              <span className="flex-1 truncate text-xs text-muted-foreground">{file}</span>
            </div>
            <CommandBlock value={snippet} secret={apiKey} label={`Copiar config do ${client}`} />
          </div>
        );
      })}
    </div>
  );
}
