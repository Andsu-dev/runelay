import type { OrganizationView } from "@runelay/shared";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";
import { useDeleteOrganization } from "@/modules/organizations/hooks/use-delete-organization";

interface DeleteOrganizationDialogProps {
  organization: OrganizationView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationDialog({ organization, open, onOpenChange }: DeleteOrganizationDialogProps) {
  const t = useT();
  const remove = useDeleteOrganization();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === organization.name;

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTyped("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (matches) remove.mutate(organization, { onSuccess: () => close(false) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("organizations.settings.deleteTitle", { name: organization.name })}
      description={t("organizations.settings.deleteWarning")}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t("organizations.settings.deleteConfirmLabel", { name: organization.name })}>
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder={organization.name}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="destructive"
            disabled={!matches}
            loading={remove.isPending}
            loadingText={t("organizations.settings.deleting")}
          >
            {t("organizations.settings.deleteSubmit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
