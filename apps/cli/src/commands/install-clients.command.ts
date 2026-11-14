import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { cliEnv } from "@/config";
import { CLIENT_CONFIG_FILES, TOML_HEADER_KEYS } from "@/constants/clients.constants";

export const installClientsCommand = () => {
  const url = `${cliEnv.RUNELEY_URL}/v1/mcp`;
  const authorization = `Bearer ${cliEnv.RUNELEY_API_KEY}`;

  const claude = Bun.spawnSync([
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
  console.log(`claude: ${claude.exitCode === 0 ? "ok" : claude.stderr.toString().trim()}`);

  for (const [client, headerKey] of Object.entries(TOML_HEADER_KEYS)) {
    const file = CLIENT_CONFIG_FILES[client as keyof typeof TOML_HEADER_KEYS];
    if (!existsSync(file)) continue;
    const current = readFileSync(file, "utf8");
    if (current.includes("[mcp_servers.runeley]")) {
      console.log(`${client}: já estava`);
      continue;
    }
    writeFileSync(
      file,
      `${current}\n[mcp_servers.runeley]\nurl = "${url}"\n${headerKey} = { Authorization = "${authorization}" }\n`,
    );
    console.log(`${client}: ok`);
  }

  if (existsSync(CLIENT_CONFIG_FILES.cursor)) {
    const cursor = JSON.parse(readFileSync(CLIENT_CONFIG_FILES.cursor, "utf8"));
    cursor.mcpServers = { ...cursor.mcpServers, runeley: { url, headers: { Authorization: authorization } } };
    writeFileSync(CLIENT_CONFIG_FILES.cursor, JSON.stringify(cursor, null, 2));
    console.log("cursor: ok");
  }
};
