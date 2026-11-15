import { CommandBlock } from "@/components/ui/display/command-block";
import { useT } from "@/lib/i18n";
import { CLIENT_SNIPPETS } from "@/modules/api-keys/constants/client-snippets.constants";

interface ClientSnippetsProps {
  apiKey: string;
}

export function ClientSnippets({ apiKey }: ClientSnippetsProps) {
  const t = useT();
  const url = `${window.location.origin}/v1/mcp`;

  return (
    <div className="flex flex-col gap-3">
      {CLIENT_SNIPPETS.map((entry) => {
        const { client, build } = entry;
        const snippet = build(url, apiKey);
        const name = "labelKey" in entry ? t(entry.labelKey) : client;
        const file = "fileKey" in entry ? t(entry.fileKey) : entry.file;
        return (
          <div key={client} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{name}</span>
              <span className="flex-1 truncate text-xs text-muted-foreground">{file}</span>
            </div>
            <CommandBlock value={snippet} secret={apiKey} label={t("apiKeys.snippets.copy", { client: name })} />
          </div>
        );
      })}
    </div>
  );
}
