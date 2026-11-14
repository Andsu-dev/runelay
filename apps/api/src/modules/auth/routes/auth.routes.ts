import { ok } from "@runelay/shared";
import { Hono } from "hono";
import { auth } from "@/modules/auth/lib/better-auth";
import { countUsers } from "@/modules/auth/repositories/user.repository";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";

export const authRoutes = new Hono<AppEnv>()
  .on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw))
  .get("/setup", (c) => respond(c, ok({ needsSetup: countUsers() === 0 })));
