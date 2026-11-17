import type { SourceView } from "@runelay/shared";

export const isAgentLocal = ({ config, status }: Pick<SourceView, "config" | "status">) =>
  config.kind === "stdio" && status === "error";
