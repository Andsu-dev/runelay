import { readdirSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { defineConfig } from "vite";

const markdownPages = readdirSync("content/docs", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, ""))
  .map((slug) => ({ path: slug ? `/${slug}.md` : "/index.md" }));

export default defineConfig({
  plugins: [
    fumadocsMdx(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
      pages: [
        { path: "/" },
        { path: "/api/search" },
        { path: "/llms.txt" },
        { path: "/llms-full.txt" },
        ...markdownPages,
      ],
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      tslib: "tslib/tslib.es6.js",
    },
  },
});
