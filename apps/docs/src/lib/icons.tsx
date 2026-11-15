import { icons } from "lucide-react";
import { createElement, type ReactNode } from "react";
import brands from "../../../lp/integration-icons.json";

const SIZE = 16;
const LUMA_DARK = 0.35;
const SVG_LOGOS = new Set(["antigravity", "canva", "claude", "codex", "cursor", "gemini", "stripe"]);
const MONO_LOGOS = new Set(["codex", "cursor"]);

const isDark = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255 < LUMA_DARK;
};

const brandIcon = (color: string | null, path: string) => (
  <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} aria-hidden="true">
    <path fill={color && !isDark(color) ? color : "currentColor"} d={path} />
  </svg>
);

const monoIcon = (src: string) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: SIZE,
      height: SIZE,
      flexShrink: 0,
      backgroundColor: "currentColor",
      mask: `url(${src}) center / contain no-repeat`,
      WebkitMask: `url(${src}) center / contain no-repeat`,
    }}
  />
);

const imageIcon = (src: string) => (
  <img src={src} width={SIZE} height={SIZE} alt="" style={{ flexShrink: 0, borderRadius: 3 }} />
);

const logo = (name: string): ReactNode => {
  const brand = (brands as Record<string, { color: string | null; path: string }>)[name];
  if (brand) return brandIcon(brand.color, brand.path);
  const src = `/logos/${name}.${SVG_LOGOS.has(name) ? "svg" : "png"}`;
  return MONO_LOGOS.has(name) ? monoIcon(src) : imageIcon(src);
};

export const resolveIcon = (icon: string | undefined): ReactNode => {
  if (!icon) return undefined;
  if (icon.startsWith("logo:")) return logo(icon.slice(5));
  const Icon = icons[icon as keyof typeof icons];
  return Icon ? createElement(Icon) : undefined;
};
