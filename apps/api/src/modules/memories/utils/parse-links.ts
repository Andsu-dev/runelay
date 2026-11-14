import { memorySlugSchema } from "@runelay/shared";

export const parseLinks = (body: string, self: string): string[] => {
  const slugs = [...body.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)].map((match) => match[1]?.trim() ?? "");
  return [...new Set(slugs)].filter((slug) => slug !== self && memorySlugSchema.safeParse(slug).success);
};
