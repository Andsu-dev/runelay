import {
  activityRangeSchema,
  createMemorySchema,
  importMemoriesSchema,
  listMemoriesSchema,
  updateMemorySchema,
} from "@runelay/shared";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import {
  createMemory,
  deleteMemory,
  describeMemoryGraph,
  describeMemoryHealth,
  findMemory,
  importMemories,
  listMemories,
  listMemoryVersions,
  updateMemory,
} from "@/modules/memories/services/memory.service";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const memoriesRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", validate("query", listMemoriesSchema), (c) =>
    respond(c, listMemories(c.var.organizationId, c.req.valid("query"))),
  )
  .post("/", validate("json", createMemorySchema), (c) =>
    respond(c, createMemory(c.var.organizationId, c.req.valid("json")), 201),
  )
  .get("/health", validate("query", activityRangeSchema), (c) =>
    respond(c, describeMemoryHealth(c.var.organizationId, c.req.valid("query").days)),
  )
  .get("/graph", (c) => respond(c, describeMemoryGraph(c.var.organizationId)))
  .post("/import", validate("json", importMemoriesSchema), (c) =>
    respond(c, importMemories(c.var.organizationId, c.req.valid("json"))),
  )
  .get("/:slug", (c) => respond(c, findMemory(c.var.organizationId, c.req.param("slug"))))
  .patch("/:slug", validate("json", updateMemorySchema), async (c) =>
    respond(c, updateMemory(c.var.organizationId, c.req.param("slug"), c.req.valid("json"))),
  )
  .delete("/:slug", (c) => respond(c, deleteMemory(c.var.organizationId, c.req.param("slug"))))
  .get("/:slug/versions", (c) => respond(c, listMemoryVersions(c.var.organizationId, c.req.param("slug"))));
