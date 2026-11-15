import type { MeView, OrganizationView, UpdateOrganizationInput } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translateError } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { meQuery } from "@/modules/auth/api/session.api";
import { updateOrganization } from "@/modules/organizations/api/organizations.api";

const patchOrganization = (me: MeView, organizationId: string, patch: UpdateOrganizationInput): MeView => {
  const apply = (organization: OrganizationView) =>
    organization.id === organizationId ? { ...organization, ...patch } : organization;
  return { ...me, organization: apply(me.organization), organizations: me.organizations.map(apply) };
};

export const useUpdateOrganization = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(organizationId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: meQuery.queryKey });
      const previous = queryClient.getQueryData(meQuery.queryKey);
      if (previous) queryClient.setQueryData(meQuery.queryKey, patchOrganization(previous, organizationId, input));
      return previous;
    },
    onError: (error, _input, previous) => {
      if (previous) queryClient.setQueryData(meQuery.queryKey, previous);
      toast(translateError(error), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: meQuery.queryKey }),
  });
};
