import {
  COMMAND_GROUPS,
  COMMAND_GUIDE,
  GLOBAL_FLAGS,
  HELP_FOOTER,
  HELP_INTRO,
  HELP_USAGE,
} from "@/constants/cli.constants";
import { nameColumn } from "@/lib/menu";
import { accent, bold, dim, iconFor, padEnd } from "@/lib/terminal";

export const renderHelp = () => {
  const guides: Record<string, { usage: string; summary: string; details?: string }> = COMMAND_GUIDE;
  const column = nameColumn([
    ...Object.values(guides).map(({ usage }) => usage),
    ...GLOBAL_FLAGS.map(([flag]) => flag),
  ]);
  const entry = (icon: string, name: string, text: string, extra?: string) => [
    `  ${dim(icon)} ${padEnd(name, column)}  ${text}`,
    ...(extra ? [`    ${" ".repeat(column)}  ${dim(extra)}`] : []),
  ];
  return [
    HELP_INTRO,
    "",
    `${bold("Usage")}  ${HELP_USAGE}`,
    ...COMMAND_GROUPS.flatMap(({ title, commands }) => [
      "",
      `  ${bold(accent(title))}`,
      ...commands.flatMap((name) => {
        const guide = guides[name] as { usage: string; summary: string; details?: string };
        return entry(iconFor(name), guide.usage, guide.summary, guide.details);
      }),
    ]),
    "",
    `  ${bold(accent("Flags"))}`,
    ...GLOBAL_FLAGS.flatMap(([flag, text]) => entry(" ", flag, text)),
    "",
    dim(HELP_FOOTER),
  ].join("\n");
};
