import { sourceNameSchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translate, translateError, translateMessage, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { createSource, sourcesQuery } from "@/modules/sources/api/sources.api";
import { STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { sourceDraftSchema } from "@/modules/sources/schemas/source-draft.schema";
import { emptyDraft, oauthClientFromDraft } from "@/modules/sources/utils/source-draft";
import { SourceConfigFields } from "./source-config-fields";

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSourceDialog({ open, onOpenChange }: AddSourceDialogProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [submitted, setSubmitted] = useState(false);

  const parsedName = sourceNameSchema.safeParse(name);
  const parsedConfig = sourceDraftSchema.safeParse(draft);

  const create = useMutation({
    mutationFn: createSource,
    onSuccess: (source) => {
      queryClient.setQueryData(sourcesQuery.queryKey, (sources = []) => [
        ...sources.filter((item) => item.name !== source.name),
        source,
      ]);
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      toast(
        translate("sources.add.added", {
          name: source.name,
          status: translate(STATUS_LABEL[source.status]).toLowerCase(),
        }),
        source.status === "ok" ? "success" : "info",
      );
      setName("");
      setDraft(emptyDraft());
      setSubmitted(false);
      onOpenChange(false);
    },
    onError: (error) => toast(translateError(error), "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!parsedName.success || !parsedConfig.success) return;
    create.mutate({ name: parsedName.data, config: parsedConfig.data, oauthClient: oauthClientFromDraft(draft) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("sources.add.title")}
      description={t("sources.add.description")}
      contentClassName="sm:max-w-lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t("sources.add.name")}
          hint={t("sources.add.nameHint")}
          error={
            submitted && !parsedName.success ? translateMessage(parsedName.error.issues[0]?.message ?? "") : undefined
          }
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="linear" autoFocus />
        </Field>
        <SourceConfigFields draft={draft} onChange={setDraft} />
        {submitted && !parsedConfig.success && (
          <p className="text-xs text-destructive">{translateMessage(parsedConfig.error.issues[0]?.message ?? "")}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} loadingText={t("sources.add.submitting")}>
            {t("sources.add.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
