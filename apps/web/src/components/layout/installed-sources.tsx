import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Skeleton } from "@/components/ui/display/skeleton";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { InstalledSourceLink } from "./installed-source-link";
import { PanelSection } from "./panel-section";

const PLACEHOLDERS = [0, 1, 2];

interface InstalledSourcesProps {
  onNavigate?: () => void;
}

export function InstalledSources({ onNavigate }: InstalledSourcesProps) {
  const t = useT();
  const { data: sources, isPending } = useQuery(sourcesQuery);

  return (
    <PanelSection label="layout.nav.installed">
      {isPending && PLACEHOLDERS.map((item) => <Skeleton key={item} className="mx-2.5 my-1.5 h-5 bg-sidebar-active" />)}
      {sources?.length === 0 && (
        <Link
          to="/connectors"
          onClick={onNavigate}
          className="px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {t("layout.shell.noConnectors")}
        </Link>
      )}
      <ul className="flex flex-col gap-0.5">
        <AnimatePresence initial={false}>
          {sources?.map((source) => (
            <motion.li
              key={source.name}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ...UI_SPRING, mass: 0.7 }}
              className="overflow-hidden"
            >
              <InstalledSourceLink source={source} onNavigate={onNavigate} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </PanelSection>
  );
}
