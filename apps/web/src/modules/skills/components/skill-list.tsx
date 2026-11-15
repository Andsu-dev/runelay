import { MagicWand01Icon } from "@hugeicons/core-free-icons";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { LoadMoreSentinel } from "@/components/ui/data/load-more-sentinel";
import { EmptyState } from "@/components/ui/display/empty-state";
import { FadeIn } from "@/components/ui/display/fade-in";
import { Skeleton } from "@/components/ui/display/skeleton";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { skillsQuery } from "@/modules/skills/api/skills.api";
import { SkillRow } from "./skill-row";

const PLACEHOLDERS = [0, 1, 2, 3, 4, 5];

interface SkillListProps {
  query: string;
}

export function SkillList({ query }: SkillListProps) {
  const t = useT();
  const { data, isPending, isPlaceholderData, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...skillsQuery(query),
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <div className="grid gap-2 md:grid-cols-2" aria-busy="true">
        {PLACEHOLDERS.map((item) => (
          <Skeleton key={item} className="h-16 rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  const skills = data?.pages.flatMap((page) => page.items) ?? [];

  if (skills.length === 0) {
    return (
      <EmptyState
        icon={MagicWand01Icon}
        title={query ? t("skills.list.emptyQueryTitle", { query }) : t("skills.list.emptyTitle")}
        description={query ? t("skills.list.emptyQueryDescription") : t("skills.list.emptyDescription")}
      />
    );
  }

  return (
    <FadeIn className={cn("-mx-3 flex flex-col transition-opacity duration-200", isPlaceholderData && "opacity-60")}>
      <ul className="grid gap-x-2 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {skills.map((skill) => (
            <motion.li
              key={skill.slug}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ...UI_SPRING, mass: 0.7 }}
              className="overflow-hidden"
            >
              <SkillRow skill={skill} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <LoadMoreSentinel active={Boolean(hasNextPage)} busy={isFetchingNextPage} onReach={() => fetchNextPage()} />
    </FadeIn>
  );
}
