import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sources/")({
  beforeLoad: () => {
    throw redirect({ to: "/connectors", search: { tab: "installed" } });
  },
});
