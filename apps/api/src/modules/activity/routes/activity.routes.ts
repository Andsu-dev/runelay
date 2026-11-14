import { activityRangeSchema, toolSearchSchema } from "@runeley/shared";
import { Hono } from "hono";
import { describeOnboarding, summarizeActivity } from "@/modules/activity/services/activity.service";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { searchTools } from "@/modules/gateway/services/search.service";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const activityRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/summary", validate("query", activityRangeSchema), (c) =>
    respond(c, summarizeActivity(c.var.organizationId, c.req.valid("query").days)),
  );

export const onboardingRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", (c) => respond(c, describeOnboarding(c.var.organizationId)));

export const toolsRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", validate("query", toolSearchSchema), async (c) =>
    respond(c, await searchTools(c.var.organizationId, c.req.valid("query"))),
  );
