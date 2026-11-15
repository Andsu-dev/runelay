import { fail, ok, type Result } from "@runelay/shared";
import { connectMcpRemote, connectStdio } from "@/modules/connectors/clients/mcp.client";
import { connectOpenApi } from "@/modules/connectors/clients/openapi.client";
import type { Connection, Tool } from "@/modules/connectors/types/connector.types";
import { connectGoogle } from "@/modules/google/clients/google.client";
import { findSource, listSources, updateStatus } from "@/modules/sources/repositories/source.repository";
import type { Source, SourceKey } from "@/modules/sources/types/source.types";

const live = new Map<string, Connection>();

const liveKey = ({ organizationId, name }: SourceKey) => `${organizationId}/${name}`;

const open = (source: Source): Promise<Result<Connection>> => {
  if (source.config.kind === "openapi") return connectOpenApi(source, source.config);
  if (source.config.kind === "stdio") return connectStdio(source, source.config);
  if (source.config.kind === "google") return connectGoogle(source, source.config);
  return connectMcpRemote(source, source.config);
};

export const disconnectSource = async (key: SourceKey): Promise<void> => {
  const connection = live.get(liveKey(key));
  live.delete(liveKey(key));
  await connection?.close().catch(() => {});
};

export const connectSource = async (key: SourceKey): Promise<Result<Connection>> => {
  await disconnectSource(key);
  const source = findSource(key);
  if (source.error) return source;
  const connection = await open(source.data);
  if (connection.error) {
    updateStatus(key, {
      status: connection.error.code === "NEEDS_AUTH" ? "needs_auth" : "error",
      error: connection.error.message,
    });
    return connection;
  }
  live.set(liveKey(key), connection.data);
  updateStatus(key, { status: "ok", error: connection.data.warning ?? null, toolCount: connection.data.tools.length });
  return connection;
};

export const listLiveTools = async (organizationId: string): Promise<Result<Tool[]>> => {
  const sources = listSources(organizationId);
  if (sources.error) return sources;
  const enabled = sources.data.filter((source) => source.enabled);
  await Promise.all(
    enabled
      .filter((source) => !live.has(liveKey(source)) && source.status !== "needs_auth")
      .map((source) => connectSource(source)),
  );
  return ok(enabled.flatMap((source) => live.get(liveKey(source))?.tools ?? []));
};

export const findTool = async (organizationId: string, fullName: string): Promise<Result<Tool>> => {
  const separator = fullName.indexOf(".");
  if (separator < 1) return fail("TOOL_NOT_FOUND", `Use o nome completo fonte.tool (recebi "${fullName}").`);
  const key = { organizationId, name: fullName.slice(0, separator) };
  const toolName = fullName.slice(separator + 1);
  if (!live.has(liveKey(key))) {
    const connected = await connectSource(key);
    if (connected.error) return connected;
  }
  const tool = live.get(liveKey(key))?.tools.find((candidate) => candidate.name === toolName);
  return tool ? ok(tool) : fail("TOOL_NOT_FOUND", `Tool "${fullName}" não encontrada. Use search_tools.`);
};
