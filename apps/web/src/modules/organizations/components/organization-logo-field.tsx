import { Camera01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { OrganizationView } from "@runelay/shared";
import { type ChangeEvent, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { translate, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useUpdateOrganization } from "@/modules/organizations/hooks/use-update-organization";
import { AVATAR_ACCEPTED_TYPES, AVATAR_MAX_UPLOAD_BYTES } from "@/modules/settings/constants/settings.constants";
import { resizeAvatar } from "@/modules/settings/utils/resize-avatar";
import { OrganizationTile } from "./organization-tile";

interface OrganizationLogoFieldProps {
  organization: OrganizationView;
  editable: boolean;
}

export function OrganizationLogoField({ organization, editable }: OrganizationLogoFieldProps) {
  const update = useUpdateOrganization(organization.id);
  const t = useT();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const disabled = !editable || update.isPending;

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast(translate("settings.profile.invalidImageType"), "error");
      return;
    }
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      toast(translate("settings.profile.imageTooLarge"), "error");
      return;
    }
    const logo = await resizeAvatar(file).catch(() => null);
    if (!logo) {
      toast(translate("settings.profile.unreadableImage"), "error");
      return;
    }
    update.mutate({ logo }, { onSuccess: () => toast(translate("organizations.settings.logoUpdated")) });
  };

  const remove = () =>
    update.mutate({ logo: null }, { onSuccess: () => toast(translate("organizations.settings.logoRemoved")) });

  return (
    <div className="flex items-center gap-4">
      <OrganizationTile
        name={organization.name}
        seed={organization.id}
        logo={organization.logo}
        className="size-16 rounded-xl text-xl"
      />
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <label
            data-sound="tap"
            aria-disabled={disabled || undefined}
            className={cn(
              buttonVariants({ variant: "glass", size: "sm" }),
              "cursor-pointer focus-within:ring-2 focus-within:ring-ring/25 aria-disabled:pointer-events-none aria-disabled:opacity-50",
            )}
          >
            <HugeiconsIcon icon={Camera01Icon} size={16} strokeWidth={1.6} />
            {organization.logo ? t("organizations.settings.changeLogo") : t("organizations.settings.uploadLogo")}
            <input
              type="file"
              accept={AVATAR_ACCEPTED_TYPES.join(",")}
              disabled={disabled}
              onChange={pick}
              className="sr-only"
            />
          </label>
          {organization.logo && (
            <ConfirmPopover
              open={confirmingRemove}
              onOpenChange={setConfirmingRemove}
              title={t("organizations.settings.removeLogoTitle")}
              description={t("organizations.settings.removeLogoDescription")}
              confirmLabel={t("organizations.settings.remove")}
              onConfirm={remove}
              align="start"
              trigger={
                <Button variant="ghost" size="sm" disabled={disabled}>
                  <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.6} />
                  {t("organizations.settings.remove")}
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
