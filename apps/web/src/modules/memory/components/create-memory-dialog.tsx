import { createMemorySchema, type MemoryType } from "@runelay/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { Dialog } from "@/components/ui/overlay/dialog";
import { toast } from "@/lib/toast";
import { createMemory } from "@/modules/memory/api/memories.api";
import { MEMORY_TYPE_OPTIONS } from "@/modules/memory/constants/memory.constants";
import { useMemoryCache } from "@/modules/memory/hooks/use-memory-cache";

interface CreateMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_DRAFT = { slug: "", name: "", description: "", type: "project" as MemoryType, body: "" };

export function CreateMemoryDialog({ open, onOpenChange }: CreateMemoryDialogProps) {
  const navigate = useNavigate();
  const storeMemory = useMemoryCache();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const parsed = createMemorySchema.safeParse(draft);
  const issueFor = (field: keyof typeof EMPTY_DRAFT) =>
    submitted && !parsed.success ? parsed.error.issues.find((issue) => issue.path[0] === field)?.message : undefined;
  const set = (field: keyof typeof EMPTY_DRAFT) => (value: string) => setDraft({ ...draft, [field]: value });

  const close = (next: boolean) => {
    onOpenChange(next);
    if (next) return;
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
  };

  const create = useMutation({
    mutationFn: createMemory,
    onSuccess: (memory) => {
      storeMemory(memory);
      toast(`${memory.name} criada.`);
      close(false);
      navigate({ to: "/memory/$slug", params: { slug: memory.slug } });
    },
    onError: (error) => toast(error.message, "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (parsed.success) create.mutate(parsed.data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Nova memória"
      description="Todos os agentes da organização passam a ler esta memória."
      contentClassName="sm:max-w-xl"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={issueFor("name")}>
            <Input value={draft.name} onChange={(event) => set("name")(event.target.value)} autoFocus />
          </Field>
          <Field label="Identificador" hint="Outras memórias citam com [[identificador]]." error={issueFor("slug")}>
            <Input
              value={draft.slug}
              onChange={(event) => set("slug")(event.target.value)}
              placeholder="deploy-de-sexta"
              className="font-mono"
            />
          </Field>
        </div>
        <Field label="Descrição" hint="Uma linha. É o que o agente lê antes de abrir." error={issueFor("description")}>
          <Input value={draft.description} onChange={(event) => set("description")(event.target.value)} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Tipo</span>
          <SegmentedControl
            label="Tipo"
            options={MEMORY_TYPE_OPTIONS}
            value={draft.type}
            onChange={(type) => setDraft({ ...draft, type })}
          />
        </div>
        <Field label="Conteúdo" error={issueFor("body")}>
          <Textarea
            value={draft.body}
            onChange={(event) => set("body")(event.target.value)}
            className="min-h-40 font-mono text-[12px]"
            placeholder="Markdown. Use [[outra-memoria]] para ligar."
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} loadingText="Criando">
            Criar memória
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
