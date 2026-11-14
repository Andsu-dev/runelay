import type { MemoryView } from "@runeley/shared";
import { MemoryLinkGroup } from "./memory-link-group";

interface MemoryLinksProps {
  memory: MemoryView;
}

export function MemoryLinks({ memory }: MemoryLinksProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold">Ligações</h2>
      <MemoryLinkGroup label="Aponta para" slugs={memory.links} empty="Nenhum [[link]] no conteúdo." />
      <MemoryLinkGroup label="Citada por" slugs={memory.backlinks} empty="Nenhuma memória cita esta." />
      {memory.brokenLinks.length > 0 && (
        <MemoryLinkGroup label="Links quebrados" slugs={memory.brokenLinks} empty="" broken />
      )}
    </section>
  );
}
