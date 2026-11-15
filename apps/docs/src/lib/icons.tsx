import { icons } from "lucide-react";
import { createElement, type ReactNode } from "react";
import brands from "../../../lp/integration-icons.json";

const SVG_FILES = import.meta.glob<string>("../logos/*.svg", { query: "?raw", import: "default", eager: true });

const TINT: Record<string, string> = { claude: "#D97757", codex: "currentColor", cursor: "currentColor" };

const LUMA_DARK = 0.35;

const isDark = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return (0.299 * (value >> 16) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255 < LUMA_DARK;
};

const BOX = { display: "inline-flex", width: 16, height: 16, flexShrink: 0 } as const;

const frame = (child: ReactNode) => <span style={BOX}>{child}</span>;

const rawSvg = (name: string) => {
  const markup = SVG_FILES[`../logos/${name}.svg`];
  if (!markup) return null;
  const tint = TINT[name];
  const sized = markup.replace(/<svg[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, "").replace("<svg ", '<svg width="16" height="16" '));
  const svg = tint ? sized.replace(/\s?fill="[^"]*"/, "").replace("<svg ", `<svg fill="${tint}" `) : sized;
  return <span style={BOX} dangerouslySetInnerHTML={{ __html: svg }} />;
};

const logo = (name: string): ReactNode => {
  const brand = (brands as Record<string, { color: string | null; path: string }>)[name];
  if (brand) {
    const fill = brand.color && !isDark(brand.color) ? brand.color : "currentColor";
    return frame(
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill={fill} d={brand.path} />
      </svg>,
    );
  }
  return rawSvg(name) ?? frame(<img src={`/logos/${name}.png`} width={16} height={16} alt="" style={{ borderRadius: 3 }} />);
};

export const resolveIcon = (icon: string | undefined): ReactNode => {
  if (!icon) return undefined;
  if (icon.startsWith("logo:")) return logo(icon.slice(5));
  const Icon = icons[icon as keyof typeof icons];
  return Icon ? createElement(Icon) : undefined;
};
