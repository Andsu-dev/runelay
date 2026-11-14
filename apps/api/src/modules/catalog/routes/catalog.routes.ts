import { catalogQuerySchema, installCatalogSchema } from "@runelay/shared";
import { Hono } from "hono";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { installCatalogItem, listCatalog } from "@/modules/catalog/services/catalog.service";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const catalogRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", validate("query", catalogQuerySchema), (c) =>
    respond(c, listCatalog(c.var.organizationId, c.req.valid("query").query)),
  )
  .post("/install", validate("json", installCatalogSchema), async (c) =>
    respond(
      c,
      await installCatalogItem(
        c.var.organizationId,
        c.req.valid("json").id,
        { authMethod: c.var.authMethod, role: c.var.role },
        c.req.valid("json").token,
      ),
      201,
    ),
  );
