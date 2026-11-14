import { createApiKeySchema } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { toast } from "@/lib/toast";
import { apiKeysQuery, createApiKey } from "@/modules/api-keys/api/api-keys.api";
import { setRecentKey } from "@/modules/api-keys/stores/recent-key.store";
import { ClientSnippets } from "./client-snippets";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showClientSnippets?: boolean;
}

export function CreateApiKeyDialog({ open, onOpenChange, showClientSnippets = true }: CreateApiKeyDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const parsed = createApiKeySchema.safeParse({ name });

  const create = useMutation({
    mutationFn: createApiKey,
    onSuccess: (key) => {
      setCreated(key.key);
      setRecentKey(key.key);
      queryClient.invalidateQueries({ queryKey: apiKeysQuery.queryKey });
      toast("Chave criada.");
    },
    onError: (error) => toast(error.message, "error"),
  });

  const close = (next: boolean) => {
    onOpenChange(next);
    if (next) return;
    setName("");
    setCreated(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsed.success) create.mutate(parsed.data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={created ? "Chave criada" : "Nova chave de API"}
      description={
        created ? "Copie agora: depois ela não aparece mais." : "Uma chave por agente facilita revogar só um deles."
      }
      contentClassName="sm:max-w-xl"
    >
      {created ? (
        <div className="flex flex-col gap-5">
          <CommandBlock value={created} secret={created} label="Copiar chave" />
          {showClientSnippets && <ClientSnippets apiKey={created} />}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome" hint="Para saber de onde vem cada chamada.">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="claude-code no mac"
              autoFocus
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={create.isPending} disabled={!parsed.success}>
              Criar chave
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
