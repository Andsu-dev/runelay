import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { createGatewayServer } from "@/modules/gateway/mcp/gateway.server";
import type { AppEnv } from "@/shared/types/app.types";

export const gatewayRoutes = new Hono<AppEnv>().all("/", requireOrganization, async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await createGatewayServer({ organizationId: c.var.organizationId, apiKeyId: c.var.apiKeyId }).connect(transport);
  return transport.handleRequest(c.req.raw);
});
