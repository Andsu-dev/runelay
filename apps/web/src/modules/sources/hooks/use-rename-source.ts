import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { translate, translateError } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { updateSource } from "@/modules/sources/api/sources.api";

export const useRenameSource = (name: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (next: string) => updateSource(name, { name: next }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["sources", updated.name], updated);
      await navigate({ to: "/connectors/$name", params: { name: updated.name }, replace: true });
      queryClient.removeQueries({ queryKey: ["sources", name], exact: true });
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      toast(translate("sources.rename.renamed", { from: name, to: updated.name }));
    },
    onError: (error) => toast(translateError(error), "error"),
  });
};
