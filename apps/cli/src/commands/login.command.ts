import { existsSync, readFileSync } from "node:fs";
import { hostname, userInfo } from "node:os";
import { type CliAuthPollView, fail, ok, type Result } from "@runeley/shared";
import { cliEnv } from "@/config/env";
import { LOCAL_SERVER_URL, SERVER_ENV_FILE } from "@/constants/cli.constants";
import { ask, bold, confirm, cyan, dim, green, interactive, startSpinner } from "@/lib/terminal";
import { readStoredConfig, saveConfig } from "@/services/config.service";
import { checkHealth, pollCliAuth, revokeCurrentKey, startCliAuth } from "@/services/runeley-api.service";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const urlFromServerEnv = () => {
  if (!existsSync(SERVER_ENV_FILE)) return null;
  const line = readFileSync(SERVER_ENV_FILE, "utf8").match(/^PUBLIC_URL=(.+)$/m)?.[1];
  return line ? normalizeUrl(line.replace(/^["']|["']$/g, "")) : null;
};

const discoverUrl = async () => {
  for (const candidate of [urlFromServerEnv(), LOCAL_SERVER_URL]) {
    if (candidate && (await checkHealth(candidate))) return candidate;
  }
  return null;
};

const askForUrl = async (): Promise<string> => {
  const answer = normalizeUrl(await ask("Endereço do seu runeley", LOCAL_SERVER_URL));
  if (await checkHealth(answer)) return answer;
  console.log(`Não encontrei um runeley em ${answer}/health. Confira o endereço.`);
  return askForUrl();
};

const chooseUrl = async (argument: string | undefined): Promise<Result<string>> => {
  const given = argument ?? cliEnv.RUNELEY_URL;
  if (given) {
    const url = normalizeUrl(given);
    return (await checkHealth(url)) ? ok(url) : fail("UPSTREAM_FAILED", `Não encontrei um runeley em ${url}/health.`);
  }
  if (!interactive)
    return fail(
      "INVALID_INPUT",
      "Sem terminal interativo. Passe o endereço: runeley login https://runeley.exemplo.com",
    );
  const found = await discoverUrl();
  if (found && (await confirm(`Encontrei o runeley em ${bold(found)}. Usar este?`))) return ok(found);
  return ok(await askForUrl());
};

const deviceName = () => {
  const host = hostname().replace(/\.local$/, "");
  const user = (() => {
    try {
      return userInfo().username;
    } catch {
      return "";
    }
  })();
  return (user ? `${user}@${host}` : host).slice(0, 80);
};

const openBrowser = (url: string) => {
  const opener = process.platform === "darwin" ? "open" : process.platform === "linux" ? "xdg-open" : null;
  if (!interactive || !opener || !Bun.which(opener)) return false;
  return Bun.spawnSync([opener, url], { stdout: "ignore", stderr: "ignore" }).exitCode === 0;
};

const waitForApproval = async (
  url: string,
  pollToken: string,
  intervalSeconds: number,
  expiresAt: string,
): Promise<Result<CliAuthPollView>> => {
  const stop = startSpinner("Esperando a autorização no navegador");
  while (Date.now() < Date.parse(expiresAt)) {
    await Bun.sleep(intervalSeconds * 1000);
    const polled = await pollCliAuth(url, pollToken);
    if (polled.error) {
      stop(dim("Falhou"));
      return polled;
    }
    if (polled.data.status === "approved") {
      stop(`${green("✓")} Autorizado`);
      return polled;
    }
    if (polled.data.status === "expired") break;
  }
  stop(dim("O código expirou"));
  return fail("CLI_AUTH_NOT_FOUND", "O código expirou antes da autorização. Rode runeley login de novo.");
};

export const loginCommand = async (argument?: string): Promise<Result<null>> => {
  const url = await chooseUrl(argument);
  if (url.error) return url;
  const started = await startCliAuth(url.data, deviceName());
  if (started.error) return started;
  const { code, pollToken, verificationUrl, expiresAt, intervalSeconds } = started.data;

  console.log(`\nSeu código: ${bold(cyan(code))}`);
  const opened = openBrowser(verificationUrl);
  console.log(
    opened
      ? dim(`Abri o navegador. Se não abriu, acesse ${verificationUrl}`)
      : `Abra ${bold(verificationUrl)} e confira o código.`,
  );

  const approved = await waitForApproval(url.data, pollToken, intervalSeconds, expiresAt);
  if (approved.error) return approved;
  const { apiKey, organizationName } = approved.data;
  if (!apiKey) return fail("UPSTREAM_FAILED", "O servidor aprovou mas não mandou a chave. Rode runeley login de novo.");

  const previous = readStoredConfig();
  const saved = saveConfig({ url: url.data, apiKey, organizationName: organizationName ?? "" });
  if (saved.error) return saved;
  if (previous.data && previous.data.apiKey !== apiKey)
    await revokeCurrentKey({ url: previous.data.url, apiKey: previous.data.apiKey, fromEnv: false });

  console.log(`\n${green("Logado")} em ${bold(organizationName ?? url.data)}. Próximo passo: ${bold("runeley sync")}`);
  return ok(null);
};
