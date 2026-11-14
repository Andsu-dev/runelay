import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CatalogSectionView } from "@runelay/shared";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { AnimatedHeight } from "@/components/layout/animated-height";
import { CatalogItemRow } from "./catalog-item-row";

interface CatalogSectionProps {
  section: CatalogSectionView;
}

export function CatalogSection({ section }: CatalogSectionProps) {
  const [open, setOpen] = useState(true);
  const contentId = useId();

  return (
    <section className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-fit items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:text-muted-foreground"
      >
        {section.title}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="flex"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={1.8} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatedHeight>
        {open && (
          <div id={contentId} className="grid gap-x-2 md:grid-cols-2">
            {section.items.map((connector) => (
              <CatalogItemRow key={connector.id} connector={connector} />
            ))}
          </div>
        )}
      </AnimatedHeight>
    </section>
  );
}
