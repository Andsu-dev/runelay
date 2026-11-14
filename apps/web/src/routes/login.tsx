import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { setupStatusQuery } from "@/modules/auth/api/session.api";
import { LoginForm } from "@/modules/auth/components/login-form";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    mode: z.enum(["signin", "signup"]).optional(),
    token: z.string().optional(),
    redirect: z.string().optional(),
  }),
  loader: ({ context }) => context.queryClient.fetchQuery(setupStatusQuery).catch(() => ({ needsSetup: false })),
  component: LoginPage,
});

function LoginPage() {
  const { mode, token, redirect } = Route.useSearch();
  const { needsSetup } = Route.useLoaderData();
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <LoginForm mode={mode ?? "signin"} setupToken={token} redirectTo={redirect} needsSetup={needsSetup} />
    </main>
  );
}
