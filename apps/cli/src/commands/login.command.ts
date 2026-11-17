import { existsSync, readFileSync } from "node:fs";
import { hostname, userInfo } from "node:os";
import { type CliAuthPollView, fail, ok, type Result } from "@runelay/shared";
import { cliEnv } from "@/config/env";
import { DESKTOP_DISCOVERY_FILE, LOCAL_SERVER_URL, NO_BROWSER_FLAG, SERVER_ENV_FILE } from "@/constants/cli.constants";
import { openBrowser } from "@/lib/browser";
import { accent, ask, bold, confirm, dim, hyperlink, interactive, mark } from "@/lib/terminal";
import { startStep } from "@/lib/ui";
import { readStoredConfig, saveConfig } from "@/services/config.service";
import { checkHealth, pollCliAuth, revokeCurrentKey, startCliAuth } from "@/services/runelay-api.service";

export const normalizeUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const urlFromServerEnv = () => {
  if (!existsSync(SERVER_ENV_FILE)) return null;
  const line = readFileSync(SERVER_ENV_FILE, "utf8").match(/^PUBLIC_URL=(.+)$/m)?.[1];
  return line ? normalizeUrl(line.replace(/^["']|["']$/g, "")) : null;
};

const urlFromDesktop = () => {
  if (!existsSync(DESKTOP_DISCOVERY_FILE)) return null;
  try {
    const { url } = JSON.parse(readFileSync(DESKTOP_DISCOVERY_FILE, "utf8")) as { url?: unknown };
    return typeof url === "string" && url.trim() ? normalizeUrl(url) : null;
  } catch {
    return null;
  }
};

export const discoverUrl = async () => {
  for (const candidate of [urlFromDesktop(), urlFromServerEnv(), LOCAL_SERVER_URL]) {
    if (candidate && (await checkHealth(candidate))) return candidate;
  }
  return null;
};

const askForUrl = async (): Promise<string> => {
  const answer = normalizeUrl(await ask("Your runelay address", LOCAL_SERVER_URL));
  if (await checkHealth(answer)) return answer;
  console.log(`${mark.warn} No runelay found at ${answer}/health. Check the address.`);
  return askForUrl();
};

export interface SignInOptions {
  browser?: boolean;
  discover?: boolean;
}

const chooseUrl = async (argument: string | undefined, discover: boolean): Promise<Result<string>> => {
  const given = argument ?? cliEnv.RUNELAY_URL;
  if (given) {
    const url = normalizeUrl(given);
    return (await checkHealth(url)) ? ok(url) : fail("UPSTREAM_FAILED", `No runelay found at ${url}/health.`);
  }
  if (discover) {
    const found = await discoverUrl();
    if (found) return ok(found);
  }
  if (!interactive)
    return fail(
      "INVALID_INPUT",
      "No interactive terminal. Pass the address: runelay login https://runelay.example.com",
    );
  const found = await discoverUrl();
  if (found && (await confirm(`Found runelay at ${bold(found)}. Use it?`))) return ok(found);
  return ok(await askForUrl());
};

const deviceName = () => {
  const host = hostname().replace(/\.local$/, "");
  const user = (() => {
    if (process.env.USER) return process.env.USER;
    try {
      return userInfo().username;
    } catch {
      return "";
    }
  })();
  return (user ? `${user}@${host}` : host).slice(0, 80);
};

const waitForApproval = async (
  url: string,
  pollToken: string,
  intervalSeconds: number,
  expiresAt: string,
): Promise<Result<CliAuthPollView>> => {
  const step = startStep("Waiting for approval in the browser");
  while (Date.now() < Date.parse(expiresAt)) {
    await Bun.sleep(intervalSeconds * 1000);
    const polled = await pollCliAuth(url, pollToken);
    if (polled.error) {
      step.fail(polled.error.message);
      return polled;
    }
    if (polled.data.status === "approved") {
      step.done("approved");
      return polled;
    }
    if (polled.data.status === "expired") break;
  }
  step.fail("the code expired");
  return fail("CLI_AUTH_NOT_FOUND", "The code expired before it was approved. Run runelay login again.");
};

export const signIn = async (
  argument?: string,
  { browser = true, discover = false }: SignInOptions = {},
): Promise<Result<null>> => {
  const url = await chooseUrl(argument, discover);
  if (url.error) return url;
  const started = await startCliAuth(url.data, deviceName());
  if (started.error) return started;
  const { code, pollToken, verificationUrl, expiresAt, intervalSeconds } = started.data;

  console.log(`\n${mark.step} Your code: ${bold(accent(code))}`);
  const opened = browser && openBrowser(verificationUrl);
  console.log(
    opened
      ? dim(`  Opened the browser. If it didn't open, go to ${hyperlink(verificationUrl, verificationUrl)}`)
      : `  Open ${bold(hyperlink(verificationUrl, verificationUrl))} and check the code.`,
  );

  const approved = await waitForApproval(url.data, pollToken, intervalSeconds, expiresAt);
  if (approved.error) return approved;
  const { apiKey, organizationName } = approved.data;
  if (!apiKey) return fail("UPSTREAM_FAILED", "The server approved but sent no key. Run runelay login again.");

  const previous = readStoredConfig();
  const saved = saveConfig({ url: url.data, apiKey, organizationName: organizationName ?? "" });
  if (saved.error) return saved;
  if (previous.data && previous.data.apiKey !== apiKey)
    await revokeCurrentKey({ url: previous.data.url, apiKey: previous.data.apiKey, fromEnv: false });

  console.log(`${mark.ok} Signed in to ${bold(organizationName ?? url.data)}`);
  return ok(null);
};

export const loginCommand = async (args: string[] = []): Promise<Result<null>> => {
  const signedIn = await signIn(
    args.find((arg) => !arg.startsWith("-")),
    { browser: !args.includes(NO_BROWSER_FLAG) },
  );
  if (signedIn.error) return signedIn;
  console.log(`${accent("→")} ${bold("Next step:")} runelay setup`);
  return ok(null);
};
