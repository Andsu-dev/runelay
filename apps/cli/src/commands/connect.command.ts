import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { attemptSync, ok, type Result } from "@runeley/shared";
import { CLIENT_CONFIG_FILES, TOML_HEADER_KEYS, TOML_RUNELEY_HEADER } from "@/constants/clients.constants";
import { dim, green, red } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";

const withTomlBlock = (current: string, block: string) => {
  const start = current.indexOf(TOML_RUNELEY_HEADER);
  if (start < 0) return `${current}${current.endsWith("\n") || !current ? "" : "\n"}\n${block}`;
  const rest = current.slice(start + TOML_RUNELEY_HEADER.length);
  const next = rest.search(/^\[/m);
  const tail = next < 0 ? "" : rest.slice(next);
  return `${current.slice(0, start)}${block}${tail ? `\n${tail}` : ""}`;
};

const report = (client: string, result: Result<unknown>) =>
  console.log(result.error ? red(`${client}: ${result.error.message}`) : `${client}: ${green("ok")}`);

const connectClaude = (url: string, authorization: string) => {
  if (!Bun.which("claude")) {
    console.log(dim("claude: pulei (comando claude não encontrado)"));
    return;
  }
  Bun.spawnSync(["claude", "mcp", "remove", "--scope", "user", "runeley"]);
  const added = Bun.spawnSync([
    "claude",
    "mcp",
    "add",
    "--scope",
    "user",
    "--transport",
    "http",
    "runeley",
    url,
    "--header",
    `Authorization: ${authorization}`,
  ]);
  if (added.exitCode === 0) console.log(`claude: ${green("ok")}`);
  else console.log(red(`claude: ${added.stderr.toString().trim()}`));
};

export const connectCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const url = `${connection.data.url}/v1/mcp`;
  const authorization = `Bearer ${connection.data.apiKey}`;

  connectClaude(url, authorization);

  for (const [client, headerKey] of Object.entries(TOML_HEADER_KEYS)) {
    const file = CLIENT_CONFIG_FILES[client as keyof typeof TOML_HEADER_KEYS];
    if (!existsSync(file)) continue;
    const block = `${TOML_RUNELEY_HEADER}\nurl = "${url}"\n${headerKey} = { Authorization = "${authorization}" }\n`;
    report(
      client,
      attemptSync(() => writeFileSync(file, withTomlBlock(readFileSync(file, "utf8"), block)), "STORAGE_FAILED"),
    );
  }

  if (existsSync(CLIENT_CONFIG_FILES.cursor)) {
    report(
      "cursor",
      attemptSync(() => {
        const cursor = JSON.parse(readFileSync(CLIENT_CONFIG_FILES.cursor, "utf8"));
        cursor.mcpServers = { ...cursor.mcpServers, runeley: { url, headers: { Authorization: authorization } } };
        writeFileSync(CLIENT_CONFIG_FILES.cursor, JSON.stringify(cursor, null, 2));
      }, "STORAGE_FAILED"),
    );
  }
  return ok(null);
};
