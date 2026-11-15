import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Textarea } from "@/components/ui/form/textarea";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translate, translateError, translatePlural, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { importSources, sourcesQuery } from "@/modules/sources/api/sources.api";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState("");

  const run = useMutation({
    mutationFn: () => importSources({ config }),
    onSuccess: ({ imported, skipped }) => {
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      toast(
        imported.length
          ? translatePlural("sources.import.imported", imported.length)
          : translate("sources.import.nothing"),
        imported.length ? "success" : "info",
      );
      for (const { name, reason } of skipped)
        toast(translate("sources.import.skipped", { name, reason }), "info", 6000);
      setConfig("");
      onOpenChange(false);
    },
    onError: (error) => toast(translateError(error), "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("sources.import.title")}
      description={t("sources.import.description")}
      contentClassName="sm:max-w-lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Textarea
          value={config}
          onChange={(event) => setConfig(event.target.value)}
          className="min-h-48 font-mono text-xs"
          required
        />
        <p className="text-xs text-muted-foreground">
          {t("sources.import.local")} <code className="rounded bg-muted px-1">bun run import</code>
        </p>
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={run.isPending}
            loadingText={t("sources.import.submitting")}
            disabled={!config.trim()}
          >
            {t("sources.import.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
