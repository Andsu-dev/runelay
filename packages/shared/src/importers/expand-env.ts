import type { EnvMap } from "./importer.types";

export const expandEnv = (value: string, env: EnvMap) =>
  value.replace(
    /\$\{([A-Za-z0-9_]+)(:-[^}]*)?\}|\$([A-Za-z0-9_]+)/g,
    (match, braced: string | undefined, fallback: string | undefined, bare: string | undefined) =>
      env[braced ?? bare ?? ""] ?? fallback?.slice(2) ?? match,
  );
