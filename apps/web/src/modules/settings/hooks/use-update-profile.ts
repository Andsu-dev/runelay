import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translateError } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { meQuery } from "@/modules/auth/api/session.api";
import { updateProfile } from "@/modules/settings/api/profile.api";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: meQuery.queryKey });
      const previous = queryClient.getQueryData(meQuery.queryKey);
      if (previous) queryClient.setQueryData(meQuery.queryKey, { ...previous, user: { ...previous.user, ...input } });
      return previous;
    },
    onError: (error, _input, previous) => {
      if (previous) queryClient.setQueryData(meQuery.queryKey, previous);
      toast(translateError(error), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: meQuery.queryKey }),
  });
};
