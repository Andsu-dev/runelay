import { createMiddleware } from "hono/factory";
import { env } from "@/config/env";
import { recordAuditEvent } from "@/modules/api-keys/repositories/audit.repository";
import { MCP_PATH } from "@/modules/auth/constants/auth.constants";
import { findMembershipRole } from "@/modules/auth/repositories/membership.repository";
import { activeOrganizationOf, hasBearer, principalFromApiKey, sessionOf } from "@/modules/auth/services/auth.service";
import { consumeRateLimit } from "@/modules/auth/services/rate-limit.service";
import { respondError } from "@/shared/http";
import type { AccountEnv, AppEnv, SessionEnv } from "@/shared/types/app.types";
import { clientIp } from "@/shared/utils/client-ip";

export const requireAccount = createMiddleware<AccountEnv>(async (c, next) => {
  const session = hasBearer(c.req.raw.headers) ? null : await sessionOf(c.req.raw.headers);
  if (!session) return respondError(c, "SESSION_REQUIRED");
  c.set("user", session.user);
  c.set("userId", session.user.id);
  c.set("sessionOrganizationId", session.organizationId);
  await next();
});

export const requireSession = createMiddleware<SessionEnv>(async (c, next) => {
  const session = hasBearer(c.req.raw.headers) ? null : await sessionOf(c.req.raw.headers);
  if (!session) return respondError(c, "SESSION_REQUIRED");
  const organization = activeOrganizationOf(session.user.id, session.organizationId);
  if (organization.error) return respondError(c, organization.error.code);
  c.set("user", session.user);
  c.set("userId", session.user.id);
  c.set("sessionOrganizationId", organization.data);
  c.set("organizationId", organization.data);
  c.set("apiKeyId", null);
  c.set("authMethod", "session");
  c.set("role", findMembershipRole(session.user.id, organization.data).data ?? null);
  await next();
});

export const requireOrganization = createMiddleware<AppEnv>(async (c, next) => {
  const principal = hasBearer(c.req.raw.headers) ? await principalFromApiKey(c.req.raw.headers) : null;
  if (principal) {
    const limit = consumeRateLimit(principal.apiKeyId ?? principal.organizationId, env.RUNELEY_RATE_LIMIT_PER_MINUTE);
    if (!limit.allowed) {
      c.header("retry-after", String(limit.retryAfter));
      return respondError(c, "RATE_LIMITED");
    }
    c.set("organizationId", principal.organizationId);
    c.set("userId", null);
    c.set("apiKeyId", principal.apiKeyId);
    c.set("authMethod", "api_key");
    c.set("role", null);
    await next();
    if (!c.req.path.startsWith(MCP_PATH)) {
      recordAuditEvent({
        organizationId: principal.organizationId,
        apiKeyId: principal.apiKeyId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ip: clientIp(c.req.raw.headers),
      });
    }
    return;
  }
  const session = hasBearer(c.req.raw.headers) ? null : await sessionOf(c.req.raw.headers);
  if (!session) return respondError(c, "UNAUTHORIZED");
  const organization = activeOrganizationOf(session.user.id, session.organizationId);
  if (organization.error) return respondError(c, organization.error.code);
  c.set("organizationId", organization.data);
  c.set("userId", session.user.id);
  c.set("apiKeyId", null);
  c.set("authMethod", "session");
  c.set("role", findMembershipRole(session.user.id, organization.data).data ?? null);
  await next();
});
