import { createOrganizationSchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translate, translateError, translateMessage, useT } from "@/lib/i18n";
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
  const t = useT();
  const queryClient = useQueryClient();
  const reset = useResetOrganizationData();
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const slug = customSlug ?? slugify(name);
  const parsed = createOrganizationSchema.safeParse({ name, slug });
  const issues = parsed.success ? [] : parsed.error.issues;
  const issueFor = (field: "name" | "slug") => {
    const message = submitted ? issues.find((issue) => issue.path[0] === field)?.message : undefined;
    return message && translateMessage(message);
  };

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
      toast(translate("organizations.create.created", { name: organization.name }));
      close(false);
    },
    onError: (error) => toast(translateError(error), "error"),
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
      title={t("organizations.create.title")}
      description={t("organizations.create.description")}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t("organizations.create.name")} error={issueFor("name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Acme" autoFocus />
        </Field>
        <Field
          label={t("organizations.create.slug")}
          hint={t("organizations.create.slugHint")}
          error={issueFor("slug")}
        >
          <Input
            value={slug}
            onChange={(event) => setCustomSlug(event.target.value)}
            placeholder="acme"
            className="font-mono"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={create.isPending} loadingText={t("organizations.create.submitting")}>
            {t("organizations.create.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
