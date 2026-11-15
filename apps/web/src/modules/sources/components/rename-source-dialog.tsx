import { sourceNameSchema } from "@runelay/shared";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translateMessage, useT } from "@/lib/i18n";
import { useRenameSource } from "@/modules/sources/hooks/use-rename-source";

interface RenameSourceDialogProps {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameSourceDialog({ name, open, onOpenChange }: RenameSourceDialogProps) {
  const t = useT();
  const rename = useRenameSource(name);
  const [draft, setDraft] = useState(name);
  const parsed = sourceNameSchema.safeParse(draft);
  const next = parsed.success ? parsed.data : null;
  const issue = parsed.success || !draft.trim() ? undefined : parsed.error.issues[0]?.message;

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setDraft(name);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (next && next !== name) rename.mutate(next, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("sources.rename.title", { name })}
      description={t("sources.rename.description")}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t("sources.rename.label")}
          hint={next && next !== draft ? t("sources.rename.preview", { name: next }) : undefined}
          error={issue && translateMessage(issue)}
        >
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
            disabled={!next || next === name}
            loading={rename.isPending}
            loadingText={t("sources.rename.submitting")}
          >
            {t("sources.rename.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
