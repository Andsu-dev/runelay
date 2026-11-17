import { existsSync, readFileSync } from "node:fs";
import { type CreateSourceInput, ok, type Result } from "@runelay/shared";
import { parseClientConfig } from "@runelay/shared/importers";
import { CLIENT_CONFIG_FILES } from "@/constants/clients.constants";
import { resolveConnection } from "@/services/config.service";
import { pushSources } from "@/services/runelay-api.service";
import { hyperlink } from "@/lib/terminal";
import { formatRow, startStep } from "@/lib/ui";

export const importCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const byName = new Map<string, CreateSourceInput>();
  const read = startStep("Reading MCP servers from your agents");
  for (const [client, file] of Object.entries(CLIENT_CONFIG_FILES)) {
    if (!existsSync(file)) continue;
    const { data: found, error } = parseClientConfig(readFileSync(file, "utf8"), process.env);
    if (error) {
      read.row(formatRow({ tone: "error", name: client, message: error.message }));
      continue;
    }
    read.row(formatRow({ tone: found.length ? "ok" : "skip", name: client, message: found.map((source) => source.name).join(", ") || "nothing" }));
    for (const source of found) if (!byName.has(source.name)) byName.set(source.name, source);
  }

  read.done(`${byName.size} found`);
  const send = startStep("Sending connections");
  const imported = await pushSources(connection.data, [...byName.values()]);
  if (imported.error) {
    send.fail(imported.error.message);
    return imported;
  }
  for (const name of imported.data.imported) send.row(formatRow({ tone: "ok", name, message: "imported" }));
  for (const { name, reason } of imported.data.skipped) send.row(formatRow({ tone: "skip", name, message: `skipped, ${reason}` }));
  send.done(`${imported.data.imported.length} imported`);
  console.log(`\nOpen ${hyperlink(connection.data.url, connection.data.url)} and sign in to the ones marked "needs reconnect".`);
  return ok(null);
};
