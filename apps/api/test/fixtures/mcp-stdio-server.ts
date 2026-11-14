import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "stdio-fixture", version: "1.0.0" });

server.registerTool("shout", { description: "Uppercase text", inputSchema: { text: z.string() } }, async ({ text }) => ({
  content: [{ type: "text", text: JSON.stringify({ shouted: text.toUpperCase() }) }],
}));

await server.connect(new StdioServerTransport());
