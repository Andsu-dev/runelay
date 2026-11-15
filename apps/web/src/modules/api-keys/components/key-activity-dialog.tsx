import { useInfiniteQuery } from "@tanstack/react-query";
import { LoadMoreSentinel } from "@/components/ui/data/load-more-sentinel";
import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";
import { apiKeyActivityQuery } from "@/modules/api-keys/api/api-keys.api";
import { KeyActivityRow } from "./key-activity-row";

interface KeyActivityDialogProps {
  keyId: string;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyActivityDialog({ keyId, label, open, onOpenChange }: KeyActivityDialogProps) {
  const t = useT();
  const activity = useInfiniteQuery({ ...apiKeyActivityQuery(keyId), enabled: open });
  const events = activity.data?.pages.flatMap((page) => page.items) ?? [];
  const total = activity.data?.pages[0]?.total ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("apiKeys.activityDialog.title", { name: label })}
      description={
        activity.data ? t.plural("apiKeys.activityDialog.description", total) : t("apiKeys.activityDialog.loading")
      }
      contentClassName="sm:max-w-2xl"
    >
      {activity.data && events.length === 0 && (
        <p className="py-6 text-center text-[13px] text-muted-foreground">{t("apiKeys.activityDialog.empty")}</p>
      )}
      <ul className="flex flex-col divide-y divide-border/60">
        {events.map((event) => (
          <KeyActivityRow key={event.id} event={event} />
        ))}
      </ul>
      <LoadMoreSentinel
        active={Boolean(activity.hasNextPage)}
        busy={activity.isFetchingNextPage}
        onReach={() => activity.fetchNextPage()}
      />
    </Dialog>
  );
}
