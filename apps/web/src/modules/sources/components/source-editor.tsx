import type { SourceView } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { toast } from "@/lib/toast";
import { sourcesQuery, updateSource } from "@/modules/sources/api/sources.api";
import { STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { sourceDraftSchema } from "@/modules/sources/schemas/source-draft.schema";
import { draftFromConfig } from "@/modules/sources/utils/source-draft";
import { SourceConfigFields } from "./source-config-fields";

interface SourceEditorProps {
  source: SourceView;
}

export function SourceEditor({ source }: SourceEditorProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => draftFromConfig(source.config));
  const [submitted, setSubmitted] = useState(false);
  const parsed = sourceDraftSchema.safeParse(draft);

  const save = useMutation({
    mutationFn: () => updateSource(source.name, { config: parsed.data }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["sources", source.name], updated);
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      toast(
        `Salvo. ${source.name}: ${STATUS_LABEL[updated.status].toLowerCase()}.`,
        updated.status === "ok" ? "success" : "info",
      );
    },
    onError: (error) => toast(error.message, "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (parsed.success) save.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <SourceConfigFields draft={draft} onChange={setDraft} lockKind />
      {submitted && !parsed.success && <p className="text-xs text-destructive">{parsed.error.issues[0]?.message}</p>}
      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending} loadingText="Salvando e testando">
          Salvar e testar
        </Button>
      </div>
    </form>
  );
}
