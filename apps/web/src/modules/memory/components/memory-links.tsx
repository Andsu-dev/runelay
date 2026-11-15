import type { MemoryView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { MemoryLinkGroup } from "./memory-link-group";

interface MemoryLinksProps {
  memory: MemoryView;
}

export function MemoryLinks({ memory }: MemoryLinksProps) {
  const t = useT();

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold">{t("memory.links.title")}</h2>
      <MemoryLinkGroup
        label={t("memory.links.outgoing")}
        slugs={memory.links}
        empty={t("memory.links.outgoingEmpty")}
      />
      <MemoryLinkGroup
        label={t("memory.links.incoming")}
        slugs={memory.backlinks}
        empty={t("memory.links.incomingEmpty")}
      />
      {memory.brokenLinks.length > 0 && (
        <MemoryLinkGroup label={t("memory.links.broken")} slugs={memory.brokenLinks} empty="" broken />
      )}
    </section>
  );
}
