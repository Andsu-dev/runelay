import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import type { SourceView } from "@runelay/shared";
import { AnimatePresence, motion } from "motion/react";
import { EmptyState } from "@/components/ui/display/empty-state";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { SourceCard } from "./source-card";

interface SourceListProps {
  sources: SourceView[];
}

export function SourceList({ sources }: SourceListProps) {
  const t = useT();

  if (sources.length === 0) {
    return (
      <EmptyState icon={PlugSocketIcon} title={t("sources.empty.title")} description={t("sources.empty.description")} />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {sources.map((source) => (
          <motion.li
            key={source.name}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ...UI_SPRING, mass: 0.7 }}
            className="overflow-hidden"
          >
            <SourceCard source={source} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
