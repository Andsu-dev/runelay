import { readFileSync } from "node:fs";
import type * as PageTree from "fumadocs-core/page-tree";
import { ImageResponse } from "takumi-js/response";
import { source } from "@/lib/source";

const LOGO = `data:image/svg+xml;base64,${readFileSync("public/favicon.svg").toString("base64")}`;

const sectionOf = (url: string, nodes: PageTree.Node[], folder?: string): string | undefined => {
  let separator: string | undefined;
  for (const node of nodes) {
    if (node.type === "separator") separator = String(node.name ?? "");
    if (node.type === "page" && node.url === url) return folder ?? separator;
    if (node.type === "folder") {
      if (node.index?.url === url) return separator;
      const found = sectionOf(url, node.children, String(node.name));
      if (found) return found;
    }
  }
};

export const ogImage = (slugs: string[]) => {
  const page = source.getPage(slugs);
  if (!page) return new Response(null, { status: 404 });
  const section = sectionOf(page.url, source.pageTree.children) ?? "Docs";
  const title = page.data.title === "Introduction" ? "runelay docs" : page.data.title;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "72px 80px",
        color: "#f4f4f5",
        backgroundColor: "#0b0b0c",
        backgroundImage:
          "radial-gradient(circle at 100% 100%, rgba(249,115,22,0.18), transparent 55%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 56px 56px, 56px 56px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: "#18181b",
          }}
        >
          <img src={LOGO} width={40} height={40} alt="" />
        </div>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em" }}>runelay</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#a1a1aa",
            backgroundColor: "#18181b",
            borderRadius: 999,
            padding: "6px 14px",
          }}
        >
          docs
        </span>
      </div>
      <span
        style={{
          marginTop: 64,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#fb923c",
        }}
      >
        {section}
      </span>
      <span style={{ marginTop: 18, fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.05em" }}>
        {title}
      </span>
      <span
        style={{
          marginTop: 28,
          fontSize: 28,
          lineHeight: 1.4,
          color: "#a1a1aa",
          maxWidth: 960,
          lineClamp: 2,
        }}
      >
        {page.data.description ?? ""}
      </span>
      <span style={{ marginTop: "auto", fontSize: 24, fontWeight: 600, color: "#71717a" }}>
        docs.runelay.com{page.url === "/" ? "" : page.url}
      </span>
    </div>,
    { width: 1200, height: 630 },
  );
};
