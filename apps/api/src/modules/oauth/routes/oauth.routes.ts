import { Hono } from "hono";
import { requireSession } from "@/modules/auth/middlewares/authenticate";
import { OAUTH_DONE_PATH } from "@/modules/oauth/constants/oauth.constants";
import { completeLogin } from "@/modules/oauth/services/oauth.service";
import type { SessionEnv } from "@/shared/types/app.types";

export const oauthRoutes = new Hono<SessionEnv>().get("/callback", requireSession, async (c) => {
  const name = c.req.query("state") ?? "";
  const code = c.req.query("code");
  const target = new URL(`${OAUTH_DONE_PATH}/${encodeURIComponent(name)}`, c.req.url);
  target.searchParams.set("oauth", "done");
  if (!code) {
    target.searchParams.set("oauth_error", c.req.query("error_description") ?? c.req.query("error") ?? "sem code");
    return c.redirect(target.pathname + target.search);
  }
  const { error } = await completeLogin({ organizationId: c.var.organizationId, name }, code);
  if (error) target.searchParams.set("oauth_error", error.message);
  return c.redirect(target.pathname + target.search);
});
