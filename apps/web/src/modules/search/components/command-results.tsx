import { Brain02Icon, MagicWand01Icon, Wrench01Icon } from "@hugeicons/core-free-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/display/skeleton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { contextSearchQuery, toolSearchQuery } from "@/modules/search/api/search.api";
import { CommandGroup } from "./command-group";
import { CommandResultLink } from "./command-result-link";

const PLACEHOLDERS = [0, 1, 2];

interface CommandResultsProps {
  term: string;
  onNavigate: () => void;
}

export function CommandResults({ term, onNavigate }: CommandResultsProps) {
  const t = useT();
  const memoryHits = useQuery({ ...contextSearchQuery(term, "memory"), placeholderData: keepPreviousData });
  const skillHits = useQuery({ ...contextSearchQuery(term, "skill"), placeholderData: keepPreviousData });
  const tools = useQuery({ ...toolSearchQuery(term), placeholderData: keepPreviousData });

  if (!term) {
    return <p className="px-2.5 py-8 text-center text-[13px] text-muted-foreground">{t("search.hint")}</p>;
  }

  if (memoryHits.isPending || skillHits.isPending || tools.isPending) {
    return (
      <div className="flex flex-col gap-2 p-2.5">
        {PLACEHOLDERS.map((item) => (
          <Skeleton key={item} className="h-9" />
        ))}
      </div>
    );
  }

  const memories = memoryHits.data ?? [];
  const skills = skillHits.data ?? [];
  const toolHits = tools.data ?? [];
  const empty = memories.length + skills.length + toolHits.length === 0;
  const stale = memoryHits.isPlaceholderData || skillHits.isPlaceholderData || tools.isPlaceholderData;

  return (
    <motion.div
      key={term}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={cn("flex flex-col gap-1 transition-opacity duration-200", stale && "opacity-60")}
    >
      {empty && (
        <p className="px-2.5 py-8 text-center text-[13px] text-muted-foreground">{t("search.empty", { term })}</p>
      )}
      {memories.length > 0 && (
        <CommandGroup label={t("search.groups.memories")}>
          {memories.map((hit) => (
            <CommandResultLink
              key={hit.slug}
              icon={Brain02Icon}
              title={hit.name}
              description={hit.snippet || hit.description}
              link={{ to: "/memory/$slug", params: { slug: hit.slug } }}
              onNavigate={onNavigate}
            />
          ))}
        </CommandGroup>
      )}
      {skills.length > 0 && (
        <CommandGroup label={t("search.groups.skills")}>
          {skills.map((hit) => (
            <CommandResultLink
              key={hit.slug}
              icon={MagicWand01Icon}
              title={hit.name}
              description={hit.snippet || hit.description}
              link={{ to: "/skills/$slug", params: { slug: hit.slug } }}
              onNavigate={onNavigate}
            />
          ))}
        </CommandGroup>
      )}
      {toolHits.length > 0 && (
        <CommandGroup label={t("search.groups.tools")}>
          {toolHits.map((tool) => (
            <CommandResultLink
              key={tool.name}
              icon={Wrench01Icon}
              title={tool.name}
              description={tool.description}
              link={{ to: "/connectors/$name", params: { name: tool.name.split(".")[0] ?? tool.name } }}
              onNavigate={onNavigate}
            />
          ))}
        </CommandGroup>
      )}
    </motion.div>
  );
}
