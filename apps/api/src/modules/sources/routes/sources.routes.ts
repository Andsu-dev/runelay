import {
  createSourceSchema,
  detectSourceAuthSchema,
  importSourcesSchema,
  listSourcesSchema,
  ok,
  updateSourceSchema,
} from "@runelay/shared";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { startLogin } from "@/modules/oauth/services/oauth.service";
import { detectSourceAuth } from "@/modules/sources/services/auth-detection.service";
import {
  createSource,
  findSourceView,
  importSources,
  listSourceViews,
  removeSource,
  summarizeSources,
  testSource,
  updateSource,
} from "@/modules/sources/services/source.service";
import { redactView } from "@/modules/sources/utils/redact-config";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

const actorOf = ({ authMethod, role }: AppEnv["Variables"]) => ({ authMethod, role });

export const sourcesRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", validate("query", listSourcesSchema), (c) => {
    const views = listSourceViews(c.var.organizationId, c.req.valid("query").status);
    return respond(c, views.error || c.var.authMethod === "session" ? views : ok(views.data.map(redactView)));
  })
  .post("/", validate("json", createSourceSchema), async (c) =>
    respond(c, await createSource(c.var.organizationId, c.req.valid("json"), actorOf(c.var)), 201),
  )
  .get("/summary", (c) => respond(c, summarizeSources(c.var.organizationId)))
  .post("/import", validate("json", importSourcesSchema), async (c) =>
    respond(c, await importSources(c.var.organizationId, c.req.valid("json"), actorOf(c.var))),
  )
  .post("/detect-auth", validate("json", detectSourceAuthSchema), async (c) =>
    respond(c, await detectSourceAuth(c.req.valid("json").url)),
  )
  .get("/:name", (c) => {
    const view = findSourceView({ organizationId: c.var.organizationId, name: c.req.param("name") });
    return respond(c, view.error || c.var.authMethod === "session" ? view : ok(redactView(view.data)));
  })
  .patch("/:name", validate("json", updateSourceSchema), async (c) =>
    respond(
      c,
      await updateSource(
        { organizationId: c.var.organizationId, name: c.req.param("name") },
        c.req.valid("json"),
        actorOf(c.var),
      ),
    ),
  )
  .delete("/:name", async (c) =>
    respond(c, await removeSource({ organizationId: c.var.organizationId, name: c.req.param("name") })),
  )
  .post("/:name/test", async (c) =>
    respond(c, await testSource({ organizationId: c.var.organizationId, name: c.req.param("name") })),
  )
  .post("/:name/oauth", async (c) =>
    respond(c, await startLogin({ organizationId: c.var.organizationId, name: c.req.param("name") })),
  );
