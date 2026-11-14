import { MemoryLinkChip } from "./memory-link-chip";

interface MemoryLinkGroupProps {
  label: string;
  slugs: string[];
  empty: string;
  broken?: boolean;
}

export function MemoryLinkGroup({ label, slugs, empty, broken = false }: MemoryLinkGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[12px] font-medium text-muted-foreground">{label}</h3>
      {slugs.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/70">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {slugs.map((slug) => (
            <MemoryLinkChip key={slug} slug={slug} broken={broken} />
          ))}
        </div>
      )}
    </div>
  );
}
