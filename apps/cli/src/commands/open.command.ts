import { ok, type Result } from "@runelay/shared";
import { cliEnv } from "@/config/env";
import { LOCAL_SERVER_URL } from "@/constants/cli.constants";
import { openBrowser } from "@/lib/browser";
import { hyperlink, mark } from "@/lib/terminal";
import { readStoredConfig } from "@/services/config.service";

export const openCommand = async (): Promise<Result<null>> => {
  const stored = readStoredConfig();
  const url = cliEnv.RUNELAY_URL ?? stored.data?.url ?? LOCAL_SERVER_URL;
  console.log(openBrowser(url) ? `${mark.ok} Opened ${hyperlink(url, url)}` : url);
  return ok(null);
};
