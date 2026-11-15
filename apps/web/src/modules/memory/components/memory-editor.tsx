import { type MemoryView, updateMemorySchema } from "@runelay/shared";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { translate, translateError, translateMessage, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { updateMemory } from "@/modules/memory/api/memories.api";
import { MEMORY_TYPE_OPTIONS } from "@/modules/memory/constants/memory.constants";
import { useMemoryCache } from "@/modules/memory/hooks/use-memory-cache";
import { MemoryPinSwitch } from "./memory-pin-switch";

interface MemoryEditorProps {
  memory: MemoryView;
}

export function MemoryEditor({ memory }: MemoryEditorProps) {
  const t = useT();
  const storeMemory = useMemoryCache();
  const [draft, setDraft] = useState({
    name: memory.name,
    description: memory.description,
    type: memory.type,
    body: memory.body,
  });
  const parsed = updateMemorySchema.safeParse(draft);
  const dirty =
    draft.name !== memory.name ||
    draft.description !== memory.description ||
    draft.type !== memory.type ||
    draft.body !== memory.body;
  const issueFor = (field: string) => {
    const message = parsed.success ? undefined : parsed.error.issues.find((issue) => issue.path[0] === field)?.message;
    return message && translateMessage(message);
  };
  const typeOptions = MEMORY_TYPE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }));

  const save = useMutation({
    mutationFn: () => updateMemory(memory.slug, draft),
    onSuccess: (updated) => {
      storeMemory(updated);
      toast(translate("memory.editor.saved"));
    },
    onError: (error) => toast(translateError(error), "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsed.success && dirty) save.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("memory.fields.name")} error={issueFor("name")}>
          <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">{t("memory.fields.type")}</span>
          <SegmentedControl
            label={t("memory.fields.type")}
            options={typeOptions}
            value={draft.type}
            onChange={(type) => setDraft({ ...draft, type })}
          />
        </div>
      </div>
      <Field label={t("memory.fields.description")} error={issueFor("description")}>
        <Input
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Field>
      <MemoryPinSwitch memory={memory} />
      <Field label={t("memory.fields.body")} error={issueFor("body")}>
        <Textarea
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
          className="min-h-[45dvh] font-mono text-[12px] leading-relaxed"
        />
      </Field>
      <div className="flex items-center justify-end gap-2">
        {dirty && (
          <Button
            type="button"
            variant="glass"
            onClick={() =>
              setDraft({ name: memory.name, description: memory.description, type: memory.type, body: memory.body })
            }
          >
            {t("memory.editor.discard")}
          </Button>
        )}
        <Button
          type="submit"
          loading={save.isPending}
          loadingText={t("memory.editor.saving")}
          disabled={!dirty || !parsed.success}
        >
          {t("memory.editor.save")}
        </Button>
      </div>
    </form>
  );
}
