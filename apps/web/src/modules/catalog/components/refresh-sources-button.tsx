import { RefreshIcon } from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconAction } from "@/components/ui/action/icon-action";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { sourcesQuery, sourcesSummaryQuery, testSource } from "@/modules/sources/api/sources.api";

export function RefreshSourcesButton() {
  const t = useT();
  const queryClient = useQueryClient();

  const refresh = useMutation({
    mutationFn: async () => {
      const sources = await queryClient.fetchQuery(sourcesQuery);
      await Promise.allSettled(sources.map((source) => testSource(source.name)));
    },
    onSuccess: () => toast(translate("catalog.toasts.retested")),
    onError: (error) => toast(translateError(error), "error"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      queryClient.invalidateQueries({ queryKey: sourcesSummaryQuery.queryKey });
    },
  });

  return (
    <IconAction
      icon={RefreshIcon}
      label={t("catalog.retest")}
      onClick={() => refresh.mutate()}
      disabled={refresh.isPending}
      spinning={refresh.isPending}
    />
  );
}
