import type { CatalogConnectorView } from "@runelay/shared";
import { sourceNameSchema } from "@runelay/shared";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translateMessage, useT } from "@/lib/i18n";
import type { useCatalogActions } from "@/modules/catalog/hooks/use-catalog-actions";

interface AddAccountDialogProps {
  connector: CatalogConnectorView;
  actions: ReturnType<typeof useCatalogActions>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const suggestedName = (connector: CatalogConnectorView) => `${connector.sourceName ?? connector.id}_2`;

export function AddAccountDialog({ connector, actions, open, onOpenChange }: AddAccountDialogProps) {
  const t = useT();
  const [draft, setDraft] = useState(() => suggestedName(connector));
  const parsed = sourceNameSchema.safeParse(draft);
  const next = parsed.success ? parsed.data : null;
  const issue = parsed.success || !draft.trim() ? undefined : parsed.error.issues[0]?.message;

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setDraft(suggestedName(connector));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (next) actions.startAddAccount(next, { onSuccess: () => close(false) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("catalog.addAccount.title", { name: connector.name })}
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
            loading={actions.addAccount.isPending}
            loadingText={t("catalog.addAccount.submitting")}
          >
            {t("catalog.addAccount.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
