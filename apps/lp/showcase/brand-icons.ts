import icons from "../integration-icons.json";

const FALLBACK = { stripe: "#635BFF", figma: "#F24E1E", github: "#181717", notion: "#000000", vercel: "#000000", sentry: "#362D59" };

const isDark = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const luminance = (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;
  return luminance < 0.35;
};

export const brandIcon = (slug: string, darkTheme: boolean) => {
  const known = (icons as Record<string, { color: string | null; path: string }>)[slug];
  const brand = known?.color ?? FALLBACK[slug as keyof typeof FALLBACK] ?? "#888888";
  const color = darkTheme && isDark(brand) ? "#EDEDED" : brand;
  if (!known) return `https://cdn.simpleicons.org/${slug}/${color.slice(1)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${known.path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
