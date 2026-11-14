import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { contextSearchSchema, memorySlugSchema, memoryTypeSchema, skillSlugSchema } from "@runeley/shared";
import { z } from "zod";
import { findTool } from "@/modules/connectors/services/connection.service";
import { pinnedInstructions, searchContext } from "@/modules/context/services/context.service";
import { GATEWAY_INFO, GATEWAY_INSTRUCTIONS, TOOL_DESCRIPTIONS } from "@/modules/gateway/constants/gateway.constants";
import { toToolResponse } from "@/modules/gateway/mcp/tool-response";
import { runCode } from "@/modules/gateway/services/execute.service";
import { searchTools } from "@/modules/gateway/services/search.service";
import { callTrackedTool } from "@/modules/gateway/services/tool-call.service";
import type { GatewayCaller } from "@/modules/gateway/types/gateway.types";
import { findMemory, writeMemory } from "@/modules/memories/services/memory.service";
import { findSkill, findSkillFile } from "@/modules/skills/services/skill.service";
import { listSourceViews } from "@/modules/sources/services/source.service";

export const createGatewayServer = (caller: GatewayCaller) => {
  const { organizationId } = caller;
  const pinned = pinnedInstructions(organizationId);
  const instructions = [GATEWAY_INSTRUCTIONS, pinned.data ?? ""].filter(Boolean).join("\n\n");
  const server = new McpServer(GATEWAY_INFO, { instructions });

  server.registerTool(
    "list_connections",
    { description: TOOL_DESCRIPTIONS.listConnections, inputSchema: {} },
    async () => toToolResponse(listSourceViews(organizationId)),
  );

  server.registerTool(
    "search_tools",
    {
      description: TOOL_DESCRIPTIONS.searchTools,
      inputSchema: {
        query: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().int().positive().optional(),
      },
    },
    async (input) => toToolResponse(await searchTools(organizationId, input)),
  );

  server.registerTool(
    "call_tool",
    {
      description: TOOL_DESCRIPTIONS.callTool,
      inputSchema: { name: z.string(), args: z.record(z.string(), z.unknown()).optional() },
    },
    async ({ name, args }) => {
      const tool = await findTool(organizationId, name);
      if (tool.error) return toToolResponse(tool);
      return toToolResponse(await callTrackedTool(caller, tool.data, args ?? {}));
    },
  );

  server.registerTool(
    "execute",
    { description: TOOL_DESCRIPTIONS.execute, inputSchema: { code: z.string() } },
    async ({ code }) => toToolResponse(await runCode(caller, code)),
  );

  server.registerTool(
    "search_context",
    { description: TOOL_DESCRIPTIONS.searchContext, inputSchema: contextSearchSchema.shape },
    async (input) => toToolResponse(searchContext(organizationId, input)),
  );

  server.registerTool(
    "read_memory",
    { description: TOOL_DESCRIPTIONS.readMemory, inputSchema: { slug: memorySlugSchema } },
    async ({ slug }) => toToolResponse(findMemory(organizationId, slug)),
  );

  server.registerTool(
    "write_memory",
    {
      description: TOOL_DESCRIPTIONS.writeMemory,
      inputSchema: {
        slug: memorySlugSchema,
        body: z.string().max(100_000),
        name: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(400).optional(),
        type: memoryTypeSchema.optional(),
        pinned: z.boolean().optional(),
      },
    },
    async (input) => toToolResponse(writeMemory(organizationId, input)),
  );

  server.registerTool(
    "read_skill",
    { description: TOOL_DESCRIPTIONS.readSkill, inputSchema: { slug: skillSlugSchema } },
    async ({ slug }) => toToolResponse(findSkill(organizationId, slug)),
  );

  server.registerTool(
    "read_skill_file",
    { description: TOOL_DESCRIPTIONS.readSkillFile, inputSchema: { slug: skillSlugSchema, path: z.string().min(1) } },
    async ({ slug, path }) => toToolResponse(findSkillFile(organizationId, slug, path)),
  );

  return server;
};
