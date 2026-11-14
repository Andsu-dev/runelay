import type { Page, SkillListItemView, SkillView } from "@runelay/shared";
import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { skillQuery, updateSkill } from "@/modules/skills/api/skills.api";

type SkillPages = InfiniteData<Page<SkillListItemView>, number>;

const LIST_KEY = ["skills", "list"];

export const useSkillToggle = (slug: string, name: string) => {
  const queryClient = useQueryClient();
  const detailKey = skillQuery(slug).queryKey;

  return useMutation({
    mutationFn: (enabled: boolean) => updateSkill(slug, { enabled }),
    onMutate: (enabled) => {
      const lists = queryClient.getQueriesData<SkillPages>({ queryKey: LIST_KEY });
      const detail = queryClient.getQueryData(detailKey);
      queryClient.setQueriesData<SkillPages>({ queryKey: LIST_KEY }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (item.slug === slug ? { ...item, enabled } : item)),
              })),
            }
          : data,
      );
      if (detail) queryClient.setQueryData<SkillView>(detailKey, { ...detail, enabled });
      return { lists, detail };
    },
    onSuccess: (skill) => toast(skill.enabled ? `${name} ativada.` : `${name} desativada.`),
    onError: (error, _enabled, snapshot) => {
      for (const [key, data] of snapshot?.lists ?? []) queryClient.setQueryData(key, data);
      if (snapshot?.detail) queryClient.setQueryData(detailKey, snapshot.detail);
      toast(error.message, "error");
    },
  });
};
