import { approveCliAuthSchema, startCliAuthSchema } from "@runeley/shared";
import { Hono } from "hono";
import { deleteApiKey } from "@/modules/api-keys/services/api-key.service";
import { requireOrganization, requireSession } from "@/modules/auth/middlewares/authenticate";
import { consumeRateLimit } from "@/modules/auth/services/rate-limit.service";
import { CLI_AUTH_START_LIMIT_PER_MINUTE } from "@/modules/cli/constants/cli-auth.constants";
import {
  approveCliAuth,
  describeCliStatus,
  findCliAuthRequest,
  pollCliAuth,
  startCliAuth,
} from "@/modules/cli/services/cli-auth.service";
import { respond, respondError } from "@/shared/http";
import type { AppEnv, SessionEnv } from "@/shared/types/app.types";
import { clientIp } from "@/shared/utils/client-ip";
import { validate } from "@/shared/validator";

const sessionRoutes = new Hono<SessionEnv>()
  .use(requireSession)
  .get("/requests/:code", (c) => respond(c, findCliAuthRequest(c.req.param("code").toUpperCase())))
  .post("/approve", validate("json", approveCliAuthSchema), async (c) =>
    respond(c, await approveCliAuth(c.var.organizationId, c.var.userId, c.req.valid("json").code)),
  );

const accountRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/status", (c) => respond(c, describeCliStatus(c.var.organizationId)))
  .delete("/key", (c) => {
    if (!c.var.apiKeyId) return respondError(c, "API_KEY_REQUIRED");
    return respond(c, deleteApiKey(c.var.organizationId, c.var.apiKeyId));
  });

export const cliRoutes = new Hono()
  .post("/auth", validate("json", startCliAuthSchema), (c) => {
    const limit = consumeRateLimit(
      `cli-auth:${clientIp(c.req.raw.headers) ?? "local"}`,
      CLI_AUTH_START_LIMIT_PER_MINUTE,
    );
    if (!limit.allowed) {
      c.header("retry-after", String(limit.retryAfter));
      return respondError(c, "CLI_AUTH_RATE_LIMITED");
    }
    return respond(c, startCliAuth(c.req.valid("json")), 201);
  })
  .get("/auth/:pollToken", (c) => respond(c, pollCliAuth(c.req.param("pollToken"))))
  .route("/auth", sessionRoutes)
  .route("/", accountRoutes);
