import { sourceNameSchema } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { toast } from "@/lib/toast";
import { createSource, sourcesQuery } from "@/modules/sources/api/sources.api";
import { STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { sourceDraftSchema } from "@/modules/sources/schemas/source-draft.schema";
import { emptyDraft } from "@/modules/sources/utils/source-draft";
import { SourceConfigFields } from "./source-config-fields";

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSourceDialog({ open, onOpenChange }: AddSourceDialogProps) {
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
        `${source.name} adicionada: ${STATUS_LABEL[source.status].toLowerCase()}.`,
        source.status === "ok" ? "success" : "info",
      );
      setName("");
      setDraft(emptyDraft());
      setSubmitted(false);
      onOpenChange(false);
    },
    onError: (error) => toast(error.message, "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!parsedName.success || !parsedConfig.success) return;
    create.mutate({ name: parsedName.data, config: parsedConfig.data });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova conexão"
      description="Ela aparece em todos os agentes que usam o runeley."
      contentClassName="sm:max-w-lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Nome"
          hint="Vira o prefixo das tools: nome.tool"
          error={submitted && !parsedName.success ? parsedName.error.issues[0]?.message : undefined}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="linear" autoFocus />
        </Field>
        <SourceConfigFields draft={draft} onChange={setDraft} />
        {submitted && !parsedConfig.success && (
          <p className="text-xs text-destructive">{parsedConfig.error.issues[0]?.message}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} loadingText="Conectando">
            Adicionar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
