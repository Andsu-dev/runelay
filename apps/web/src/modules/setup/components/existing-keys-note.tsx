import type { ApiKeyView } from "@runelay/shared";
import { CommandBlock } from "@/components/ui/display/command-block";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface ExistingKeysNoteProps {
  latest: ApiKeyView | null;
  apiKey: string | null;
}

export function ExistingKeysNote({ latest, apiKey }: ExistingKeysNoteProps) {
  const t = useT();

  if (apiKey) {
    return (
      <div className="flex flex-col gap-1.5">
        {latest && (
          <span className="text-xs text-muted-foreground">
            {t("setup.keys.createdAt", {
              name: latest.name ?? t("setup.keys.unnamed"),
              date: formatDate(latest.createdAt),
            })}
          </span>
        )}
        <CommandBlock value={apiKey} secret={apiKey} label={t("setup.keys.copyKey")} />
      </div>
    );
  }
  if (!latest) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5 text-[13px]">
      <span>
        {t("setup.keys.legacyPrefix")}{" "}
        <span className="font-medium">{latest.name ?? t("setup.keys.unnamedInline")}</span>{" "}
        <code className="font-mono text-xs text-muted-foreground">{latest.start}…</code> {t("setup.keys.legacySuffix")}
      </span>
      <span className="text-xs text-muted-foreground">{t("setup.keys.legacyHint")}</span>
    </div>
  );
}
