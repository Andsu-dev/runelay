import { createApiKeySchema, paginationSchema } from "@runeley/shared";
import { Hono } from "hono";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  listKeyActivity,
  revealApiKey,
} from "@/modules/api-keys/services/api-key.service";
import { requireSession } from "@/modules/auth/middlewares/authenticate";
import { respond } from "@/shared/http";
import type { SessionEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const apiKeysRoutes = new Hono<SessionEnv>()
  .use(requireSession)
  .get("/", (c) => respond(c, listApiKeys(c.var.organizationId)))
  .post("/", validate("json", createApiKeySchema), async (c) =>
    respond(c, await createApiKey(c.var.organizationId, c.var.userId, c.req.valid("json").name), 201),
  )
  .get("/:id/activity", validate("query", paginationSchema), (c) => {
    const { cursor, limit } = c.req.valid("query");
    return respond(c, listKeyActivity(c.var.organizationId, c.req.param("id"), cursor, limit));
  })
  .get("/:id/secret", (c) => respond(c, revealApiKey(c.var.organizationId, c.req.param("id"))))
  .delete("/:id", (c) => respond(c, deleteApiKey(c.var.organizationId, c.req.param("id"))));
