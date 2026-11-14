import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";

export const useSignOut = () => {
  const navigate = useNavigate();

  return async () => {
    await authClient.signOut();
    queryClient.clear();
    navigate({ to: "/login", search: {} });
  };
};
