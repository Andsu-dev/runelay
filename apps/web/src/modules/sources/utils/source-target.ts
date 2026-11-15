import type { GoogleConfig, SourceConfig } from "@runelay/shared";

export const sourceTarget = (config: Exclude<SourceConfig, GoogleConfig>) => {
  if (config.kind === "stdio") return [config.command, ...config.args].join(" ");
  if (config.kind === "openapi") return config.spec;
  return config.url;
};
