import { createSourceSchema, importSourcesSchema, updateSourceSchema } from "@runeley/shared";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { startLogin } from "@/modules/oauth/services/oauth.service";
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
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const sourcesRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", (c) => respond(c, listSourceViews(c.var.organizationId)))
  .post("/", validate("json", createSourceSchema), async (c) =>
    respond(c, await createSource(c.var.organizationId, c.req.valid("json")), 201),
  )
  .get("/summary", (c) => respond(c, summarizeSources(c.var.organizationId)))
  .post("/import", validate("json", importSourcesSchema), async (c) =>
    respond(c, await importSources(c.var.organizationId, c.req.valid("json"))),
  )
  .get("/:name", (c) => respond(c, findSourceView({ organizationId: c.var.organizationId, name: c.req.param("name") })))
  .patch("/:name", validate("json", updateSourceSchema), async (c) =>
    respond(
      c,
      await updateSource({ organizationId: c.var.organizationId, name: c.req.param("name") }, c.req.valid("json")),
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
