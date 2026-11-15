import { readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const { default: server } = await import("../dist/server/server.js");

const slugs = readdirSync("content/docs", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => file.replace(/\.mdx$/, "").replace(/(^|\/)index$/, "") || "index");

for (const slug of slugs) {
  const response = await server.fetch(new Request(`http://localhost/og/${slug}.png`));
  if (!response.ok) throw new Error(`og/${slug}.png answered ${response.status}`);
  const file = `dist/client/og/${slug}.png`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

const SITE = "https://docs.runelay.com";
const urls = slugs.map((slug) => `${SITE}${slug === "index" ? "/" : `/${slug}/`}`);
await writeFile(
  "dist/client/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`,
);
const missing = await server.fetch(new Request("http://localhost/__not-found__"));
if (missing.status !== 404) throw new Error(`the not found page answered ${missing.status}`);
await writeFile("dist/client/404.html", await missing.text());
await writeFile("dist/client/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`postbuild: ${slugs.length} share images, sitemap, robots.txt and 404.html`);
