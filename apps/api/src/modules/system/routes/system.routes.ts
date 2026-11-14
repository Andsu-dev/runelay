import { Hono } from "hono";
import { requireSession } from "@/modules/auth/middlewares/authenticate";
import { describeVersion, startUpdate } from "@/modules/system/services/version.service";
import { respond } from "@/shared/http";
import type { SessionEnv } from "@/shared/types/app.types";

export const systemRoutes = new Hono<SessionEnv>()
  .use(requireSession)
  .get("/version", async (c) => respond(c, await describeVersion(c.var.role)))
  .post("/update", (c) => respond(c, startUpdate(c.var.role), 202));
