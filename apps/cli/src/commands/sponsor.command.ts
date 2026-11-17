import { ok, type Result } from "@runelay/shared";
import { SPONSOR_URL } from "@/constants/cli.constants";
import { openBrowser } from "@/lib/browser";
import { hyperlink, mark } from "@/lib/terminal";

export const sponsorCommand = async (): Promise<Result<null>> => {
  console.log(openBrowser(SPONSOR_URL) ? `${mark.ok} Opened ${hyperlink(SPONSOR_URL, SPONSOR_URL)}. Thank you!` : SPONSOR_URL);
  return ok(null);
};
