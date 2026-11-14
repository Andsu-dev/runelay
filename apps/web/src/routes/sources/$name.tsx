import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/sources/$name")({
  validateSearch: z.object({ oauth: z.literal("done").optional(), oauth_error: z.string().optional() }),
  beforeLoad: ({ params, search }) => {
    throw redirect({ to: "/connectors/$name", params: { name: params.name }, search, replace: true });
  },
});
