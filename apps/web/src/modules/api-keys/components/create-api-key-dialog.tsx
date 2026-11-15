import { createApiKeySchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translate, translateError, useT } from "@/lib/i18n";
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
  const t = useT();
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
      toast(translate("apiKeys.create.created"));
    },
    onError: (error) => toast(translateError(error), "error"),
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
      title={created ? t("apiKeys.create.createdTitle") : t("apiKeys.create.title")}
      description={created ? t("apiKeys.create.createdDescription") : t("apiKeys.create.description")}
      contentClassName="sm:max-w-xl"
    >
      {created ? (
        <div className="flex flex-col gap-5">
          <CommandBlock value={created} secret={created} label={t("apiKeys.create.copy")} />
          {showClientSnippets && <ClientSnippets apiKey={created} />}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("apiKeys.create.name")} hint={t("apiKeys.create.nameHint")}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("apiKeys.create.namePlaceholder")}
              autoFocus
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={create.isPending} disabled={!parsed.success}>
              {t("apiKeys.create.submit")}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
