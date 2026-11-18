export const splitFrontmatter = (text: string): { meta: Record<string, unknown>; body: string } => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: text };
  try {
    const meta = Bun.YAML.parse(match[1] ?? "");
    return {
      meta: meta && typeof meta === "object" ? (meta as Record<string, unknown>) : {},
      body: text.slice(match[0].length),
    };
  } catch {
    return { meta: {}, body: text.slice(match[0].length) };
  }
};
