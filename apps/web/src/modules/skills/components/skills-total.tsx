import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { skillsQuery } from "@/modules/skills/api/skills.api";

interface SkillsTotalProps {
  query: string;
}

export function SkillsTotal({ query }: SkillsTotalProps) {
  const t = useT();
  const { data } = useInfiniteQuery({ ...skillsQuery(query), placeholderData: keepPreviousData });
  const total = data?.pages[0]?.total;
  if (total === undefined) return t("skills.page.totalLoading");
  return t.plural("skills.page.total", total);
}
