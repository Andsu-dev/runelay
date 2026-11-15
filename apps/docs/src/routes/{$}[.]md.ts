import { createFileRoute } from "@tanstack/react-router";
import { docsLlms } from "@/lib/source";

export const Route = createFileRoute("/{$}.md")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).pathname.replace(/(.)\/$/, "$1");
        return (await docsLlms.serve(path)) ?? new Response(null, { status: 404 });
      },
    },
  },
});
