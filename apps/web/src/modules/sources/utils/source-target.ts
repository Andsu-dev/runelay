import type { SourceConfig } from "@runelay/shared";

export const sourceTarget = (config: SourceConfig) => {
  if (config.kind === "stdio") return [config.command, ...config.args].join(" ");
  if (config.kind === "openapi") return config.spec;
  return config.url;
};
