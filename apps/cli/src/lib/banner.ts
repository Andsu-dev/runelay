import {
  BANNER_GAP,
  BANNER_INDENT,
  COMPACT_MARK,
  LOGO_ROWS,
  NARROW_TEXT_ROW,
  WORDMARK_ROWS,
  WORDMARK_TOP_ROW,
} from "@/constants/banner.constants";
import { SPONSOR_PROMPT, SPONSOR_URL } from "@/constants/cli.constants";
import { REVEAL_DELAY_MS } from "@/constants/terminal.constants";
import { JSON_FLAG } from "@/lib/json-output";
import {
  bold,
  type ColorDepth,
  colorDepth,
  decorated,
  detectMotion,
  dim,
  type Env,
  gradientAt,
  hyperlink,
  motion,
  paintRgb,
  terminalColumns,
  visibleWidth,
} from "@/lib/terminal";

export type BannerMode = "off" | "static" | "animated";

export const bannerMode = ({ args, env, isTTY }: { args: string[]; env: Env; isTTY: boolean }): BannerMode => {
  if (!isTTY || args.includes(JSON_FLAG)) return "off";
  return detectMotion(args, env, isTTY) ? "animated" : "static";
};

const FULL_WIDTH =
  BANNER_INDENT.length + visibleWidth(LOGO_ROWS[0] ?? "") + BANNER_GAP.length + visibleWidth(WORDMARK_ROWS[0] ?? "");

export const renderBanner = ({
  version,
  depth = colorDepth,
  columns = terminalColumns(),
}: {
  version: string;
  depth?: ColorDepth;
  columns?: number;
}) => {
  const versionText = `v${version}`;
  const narrow = columns < FULL_WIDTH;
  return LOGO_ROWS.map((logo, index) => {
    const color = paintRgb(gradientAt(index, LOGO_ROWS.length), depth);
    const narrowText = [bold(color("runelay")), dim(versionText)][index - NARROW_TEXT_ROW] ?? "";
    const word = WORDMARK_ROWS[index - WORDMARK_TOP_ROW];
    const versionRow = index === WORDMARK_TOP_ROW + WORDMARK_ROWS.length;
    const wideText = word ? color(word.trimEnd()) : versionRow ? dim(versionText) : "";
    const text = narrow ? narrowText : wideText;
    return `${BANNER_INDENT}${color(logo)}${BANNER_GAP}${text}`.trimEnd();
  });
};

export const renderCompactBanner = ({ version, depth = colorDepth }: { version: string; depth?: ColorDepth }) =>
  `${paintRgb(gradientAt(0, 2), depth)(COMPACT_MARK.slice(0, 1))}${paintRgb(gradientAt(1, 2), depth)(COMPACT_MARK.slice(1))} ${bold("runelay")} ${dim(`v${version}`)}`;

export const printBanner = async (version: string) => {
  if (!decorated) return;
  const lines = renderBanner({ version });
  console.log("");
  for (const line of lines) {
    console.log(line);
    if (motion) await Bun.sleep(REVEAL_DELAY_MS);
  }
  console.log("");
};

export const sponsorLine = () => `${SPONSOR_PROMPT} ${hyperlink(SPONSOR_URL, SPONSOR_URL)}`;

export const printCompactBanner = (version: string) => {
  if (decorated) console.log(`${renderCompactBanner({ version })}\n`);
};
