import { createOrganizationSchema, setActiveOrganizationSchema, updateOrganizationSchema } from "@runelay/shared";
import { Hono } from "hono";
import { requireAccount, requireSession } from "@/modules/auth/middlewares/authenticate";
import {
  createOrganization,
  describeMe,
  listOrganizations,
  removeOrganization,
  switchOrganization,
  updateOrganization,
} from "@/modules/organizations/services/organization.service";
import { respond } from "@/shared/http";
import type { AccountEnv, SessionEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

export const meRoutes = new Hono<SessionEnv>()
  .use(requireSession)
  .get("/", (c) => respond(c, describeMe(c.var.user, c.var.organizationId)));

export const organizationsRoutes = new Hono<AccountEnv>()
  .use(requireAccount)
  .get("/", (c) => respond(c, listOrganizations(c.var.userId)))
  .post("/", validate("json", createOrganizationSchema), async (c) =>
    respond(c, await createOrganization(c.req.raw.headers, c.var.userId, c.req.valid("json")), 201),
  )
  .post("/active", validate("json", setActiveOrganizationSchema), async (c) =>
    respond(c, await switchOrganization(c.req.raw.headers, c.var.user, c.req.valid("json").organizationId)),
  )
  .patch("/:id", validate("json", updateOrganizationSchema), (c) =>
    respond(c, updateOrganization(c.var.userId, c.req.param("id"), c.req.valid("json"))),
  )
  .delete("/:id", async (c) => respond(c, await removeOrganization(c.var.user, c.req.param("id"))));
