import { Building03Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { useT } from "@/lib/i18n";
import { meQuery } from "@/modules/auth/api/session.api";
import { SettingsRow } from "@/modules/settings/components/settings-row";
import { SettingsSection } from "@/modules/settings/components/settings-section";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";
import { OrganizationLogoField } from "./organization-logo-field";
import { OrganizationNameField } from "./organization-name-field";

export function OrganizationSettingsSection() {
  const { data: me } = useSuspenseQuery(meQuery);
  const t = useT();
  const [deleting, setDeleting] = useState(false);
  const organization = me.organization;
  const editable = organization.role !== "member";
  const onlyOne = me.organizations.length < 2;

  return (
    <>
      <SettingsSection icon={Building03Icon} title={t("organizations.settings.title")}>
        <OrganizationLogoField organization={organization} editable={editable} />
        <OrganizationNameField organization={organization} editable={editable} />
        <SettingsRow label={t("organizations.settings.slug")} description={organization.slug} />
      </SettingsSection>
      {organization.role === "owner" && (
        <SettingsSection icon={Delete02Icon} title={t("organizations.settings.dangerTitle")}>
          <SettingsRow
            label={t("organizations.settings.deleteLabel")}
            description={
              onlyOne ? t("organizations.settings.deleteOnlyOne") : t("organizations.settings.deleteDescription")
            }
          >
            <Button variant="destructive" size="sm" disabled={onlyOne} onClick={() => setDeleting(true)}>
              {t("organizations.settings.deleteSubmit")}
            </Button>
          </SettingsRow>
        </SettingsSection>
      )}
      <DeleteOrganizationDialog organization={organization} open={deleting} onOpenChange={setDeleting} />
    </>
  );
}
