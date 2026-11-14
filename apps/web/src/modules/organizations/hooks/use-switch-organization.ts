import type { MeView, OrganizationView } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "@/lib/toast";
import { meQuery } from "@/modules/auth/api/session.api";
import { setActiveOrganization } from "@/modules/organizations/api/organizations.api";

export const useResetOrganizationData = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  return async (me: MeView) => {
    queryClient.setQueryData(meQuery.queryKey, me);
    await queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== "me" });
    await router.invalidate();
    navigate({ to: "/overview" });
  };
};

export const useSwitchOrganization = () => {
  const queryClient = useQueryClient();
  const reset = useResetOrganizationData();

  return useMutation({
    mutationFn: (organization: OrganizationView) => setActiveOrganization({ organizationId: organization.id }),
    onMutate: (organization) => {
      const previous = queryClient.getQueryData(meQuery.queryKey);
      if (previous) queryClient.setQueryData(meQuery.queryKey, { ...previous, organization });
      return previous;
    },
    onSuccess: async (me) => {
      await reset(me);
      toast(`Agora em ${me.organization.name}.`);
    },
    onError: (error, _organization, previous) => {
      if (previous) queryClient.setQueryData(meQuery.queryKey, previous);
      toast(error.message, "error");
    },
  });
};
