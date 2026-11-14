import type { CreateSourceInput } from "@runeley/shared";

export const SEED_USER = { email: "me@runeley.local", password: "senha-forte-123", name: "Anderson" };

export const SEED_API_KEY_NAME = "seed";

export const SEED_SOURCES: CreateSourceInput[] = [
  { name: "deepwiki", config: { kind: "mcp", url: "https://mcp.deepwiki.com/mcp", headers: {} } },
  {
    name: "everything",
    config: { kind: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-everything"], env: {} },
  },
  {
    name: "petstore",
    config: {
      kind: "openapi",
      spec: "https://petstore3.swagger.io/api/v3/openapi.json",
      baseUrl: null,
      headers: {},
      query: {},
    },
  },
  { name: "linear", config: { kind: "mcp", url: "https://mcp.linear.app/mcp", headers: {} } },
];
