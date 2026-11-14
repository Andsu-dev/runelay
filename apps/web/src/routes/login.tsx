import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "@/modules/auth/components/login-form";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    mode: z.enum(["signin", "signup"]).optional(),
    token: z.string().optional(),
    redirect: z.string().optional(),
  }),
  component: LoginPage,
});

function LoginPage() {
  const { mode, token, redirect } = Route.useSearch();
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <LoginForm mode={mode ?? "signin"} setupToken={token} redirectTo={redirect} />
    </main>
  );
}
