import type { SourceConfig, SourceView } from "@runeley/shared";

const HIDDEN = "••••••";

const hide = (map: Record<string, string>) => Object.fromEntries(Object.keys(map).map((key) => [key, HIDDEN]));

export const redactConfig = (config: SourceConfig): SourceConfig => {
  if (config.kind === "stdio") return { ...config, env: hide(config.env) };
  if (config.kind === "openapi") return { ...config, headers: hide(config.headers), query: hide(config.query) };
  return { ...config, headers: hide(config.headers) };
};

export const redactView = (view: SourceView): SourceView => ({ ...view, config: redactConfig(view.config) });
