import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconAction } from "@/components/ui/action/icon-action";
import { toast } from "@/lib/toast";
import { sourcesQuery, sourcesSummaryQuery, testSource } from "@/modules/sources/api/sources.api";

export function RefreshSourcesButton() {
  const queryClient = useQueryClient();

  const refresh = useMutation({
    mutationFn: async () => {
      const sources = await queryClient.fetchQuery(sourcesQuery);
      await Promise.allSettled(sources.map((source) => testSource(source.name)));
    },
    onSuccess: () => toast("Conectores testados de novo."),
    onError: (error) => toast(error.message, "error"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      queryClient.invalidateQueries({ queryKey: sourcesSummaryQuery.queryKey });
    },
  });

  return (
    <IconAction
      icon={RefreshIcon}
      label="Testar os instalados de novo"
      onClick={() => refresh.mutate()}
      disabled={refresh.isPending}
      spinning={refresh.isPending}
    />
  );
}
