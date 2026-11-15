import { createFileRoute } from "@tanstack/react-router";
import { ogImage } from "@/lib/og";

export const Route = createFileRoute("/og/{$}.png")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const slugs = params._splat?.split("/").filter(Boolean) ?? [];
        return ogImage(slugs[0] === "index" && slugs.length === 1 ? [] : slugs);
      },
    },
  },
});
