import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { translate } from "@/lib/i18n";
import { meQuery } from "@/modules/auth/api/session.api";
import { cliAuthRequestQuery } from "@/modules/cli/api/cli-auth.api";
import { CliAuthorizeCard } from "@/modules/cli/components/cli-authorize-card";
import { CliAuthorizeError } from "@/modules/cli/components/cli-authorize-error";

export const Route = createFileRoute("/cli/authorize")({
  validateSearch: z.object({ code: z.string().trim().toUpperCase().catch("") }),
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery).catch(() => null);
    if (!me) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: ({ context, deps }) => {
    if (!deps.code) throw new Error(translate("cli.openLink"));
    return context.queryClient.ensureQueryData(cliAuthRequestQuery(deps.code));
  },
  errorComponent: CliAuthorizeError,
  component: CliAuthorizePage,
});

function CliAuthorizePage() {
  const { code } = Route.useSearch();
  const { data: request } = useSuspenseQuery(cliAuthRequestQuery(code));
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col">
        <CliAuthorizeCard request={request} />
      </div>
    </main>
  );
}
