import { contextBriefSchema, contextSearchSchema } from "@runeley/shared";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { buildBrief, searchContext } from "@/modules/context/services/context.service";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const contextRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/search", validate("query", contextSearchSchema), (c) =>
    respond(c, searchContext(c.var.organizationId, c.req.valid("query"))),
  )
  .get("/brief", validate("query", contextBriefSchema), (c) =>
    respond(c, buildBrief(c.var.organizationId, c.req.valid("query").client)),
  );
