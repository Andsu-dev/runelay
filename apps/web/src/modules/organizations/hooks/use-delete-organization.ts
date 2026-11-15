import type { OrganizationView } from "@runelay/shared";
import { useMutation } from "@tanstack/react-query";
import { translate, translateError } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { deleteOrganization } from "@/modules/organizations/api/organizations.api";
import { useResetOrganizationData } from "./use-switch-organization";

export const useDeleteOrganization = () => {
  const reset = useResetOrganizationData();

  return useMutation({
    mutationFn: (organization: OrganizationView) => deleteOrganization(organization.id),
    onSuccess: async (me, organization) => {
      await reset(me);
      toast(translate("organizations.settings.deleted", { name: organization.name }));
    },
    onError: (error) => toast(translateError(error), "error"),
  });
};
