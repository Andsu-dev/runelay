import { Hono } from "hono";
import { auth } from "@/modules/auth/lib/better-auth";
import type { AppEnv } from "@/shared/types/app.types";

export const authRoutes = new Hono<AppEnv>().on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
