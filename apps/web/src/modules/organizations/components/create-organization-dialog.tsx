import { createOrganizationSchema } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { toast } from "@/lib/toast";
import { meQuery } from "@/modules/auth/api/session.api";
import { createOrganization } from "@/modules/organizations/api/organizations.api";
import { useResetOrganizationData } from "@/modules/organizations/hooks/use-switch-organization";
import { slugify } from "@/modules/organizations/utils/slugify";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const queryClient = useQueryClient();
  const reset = useResetOrganizationData();
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const slug = customSlug ?? slugify(name);
  const parsed = createOrganizationSchema.safeParse({ name, slug });
  const issues = parsed.success ? [] : parsed.error.issues;
  const issueFor = (field: "name" | "slug") =>
    submitted ? issues.find((issue) => issue.path[0] === field)?.message : undefined;

  const close = (next: boolean) => {
    onOpenChange(next);
    if (next) return;
    setName("");
    setCustomSlug(null);
    setSubmitted(false);
  };

  const create = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (organization) => {
      const me = await queryClient.fetchQuery({ ...meQuery, staleTime: 0 });
      await reset(me);
      toast(`${organization.name} criada.`);
      close(false);
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
      title="Nova organização"
      description="Conectores, habilidades e memória ficam separados por organização."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nome" error={issueFor("name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Acme" autoFocus />
        </Field>
        <Field label="Identificador" hint="Aparece na URL e no CLI." error={issueFor("slug")}>
          <Input
            value={slug}
            onChange={(event) => setCustomSlug(event.target.value)}
            placeholder="acme"
            className="font-mono"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} loadingText="Criando">
            Criar organização
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
