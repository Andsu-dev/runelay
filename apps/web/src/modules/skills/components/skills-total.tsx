import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/format";
import { skillsQuery } from "@/modules/skills/api/skills.api";

interface SkillsTotalProps {
  query: string;
}

export function SkillsTotal({ query }: SkillsTotalProps) {
  const { data } = useInfiniteQuery({ ...skillsQuery(query), placeholderData: keepPreviousData });
  const total = data?.pages[0]?.total;
  if (total === undefined) return "Instruções que os agentes carregam quando precisam.";
  return `${formatNumber(total)} ${total === 1 ? "habilidade" : "habilidades"}. Os agentes carregam cada uma quando precisam.`;
}
