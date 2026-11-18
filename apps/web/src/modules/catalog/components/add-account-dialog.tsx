import { type SourceView, sourceNameSchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translateError, translateMessage, useT } from "@/lib/i18n";
import { openPendingTab, sendTab } from "@/lib/oauth-tab";
import { toast } from "@/lib/toast";
import { INSTALL_MUTATION_KEY } from "@/modules/catalog/hooks/use-catalog-actions";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { sourcesQuery, startSourceOAuth } from "@/modules/sources/api/sources.api";

interface AddAccountDialogProps {
  name: string;
  sourceName: string;
  createAccount: (name: string) => Promise<SourceView>;
  trigger?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({
  name,
  sourceName,
  createAccount,
  trigger,
  open,
  onOpenChange,
}: AddAccountDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const suggestedName = `${sourceName}_2`;
  const [draft, setDraft] = useState(suggestedName);
  const parsed = sourceNameSchema.safeParse(draft);
  const next = parsed.success ? parsed.data : null;
  const issue = parsed.success || !draft.trim() ? undefined : parsed.error.issues[0]?.message;

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setDraft(suggestedName);
  };

  const addAccount = useMutation({
    mutationKey: INSTALL_MUTATION_KEY,
    mutationFn: async ({ tab, name }: { tab: Window | null; name: string }) => {
      const source = await createAccount(name);
      const { authorizationUrl } = await startSourceOAuth(source.name);
      return sendTab(tab, authorizationUrl);
    },
    onSuccess: (redirecting, { name }) => {
      if (!redirecting) toast(t("catalog.toasts.installed", { name }));
      close(false);
    },
    onError: (error, { tab }) => {
      tab?.close();
      toast(translateError(error), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      queryClient.invalidateQueries({ queryKey: onboardingQuery.queryKey });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (next && !addAccount.isPending) addAccount.mutate({ tab: openPendingTab(), name: next });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      trigger={trigger}
      title={t("catalog.addAccount.title", { name })}
      description={t("catalog.addAccount.description")}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t("catalog.addAccount.label")} error={issue && translateMessage(issue)}>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            autoFocus
          />
        </Field>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!next}
            loading={addAccount.isPending}
            loadingText={t("catalog.addAccount.submitting")}
          >
            {t("catalog.addAccount.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
