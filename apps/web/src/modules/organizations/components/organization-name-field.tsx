import { type OrganizationView, updateOrganizationSchema } from "@runelay/shared";
import { translate, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { useUpdateOrganization } from "@/modules/organizations/hooks/use-update-organization";
import { InlineEditText } from "@/modules/settings/components/inline-edit-text";

interface OrganizationNameFieldProps {
  organization: OrganizationView;
  editable: boolean;
}

const normalizeName = (draft: string) => {
  const parsed = updateOrganizationSchema.safeParse({ name: draft });
  return parsed.success ? (parsed.data.name ?? null) : null;
};

export function OrganizationNameField({ organization, editable }: OrganizationNameFieldProps) {
  const update = useUpdateOrganization(organization.id);
  const t = useT();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-medium">{t("organizations.settings.name")}</span>
      <InlineEditText
        value={organization.name}
        normalize={normalizeName}
        onSave={(name) =>
          update.mutate({ name }, { onSuccess: () => toast(translate("organizations.settings.nameSaved")) })
        }
        inputLabel={t("organizations.settings.name")}
        editLabel={t("organizations.settings.editName")}
        saveLabel={t("organizations.settings.saveName")}
        cancelLabel={t("organizations.settings.cancel")}
        disabled={!editable || update.isPending}
      />
    </div>
  );
}
