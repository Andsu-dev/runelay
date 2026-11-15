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

console.log(`og: ${slugs.length} images`);
