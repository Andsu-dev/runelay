import { createSkillSchema, importSkillsSchema, listSkillsSchema, updateSkillSchema } from "@runeley/shared";
import { Hono } from "hono";
import { z } from "zod";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import {
  createSkill,
  deleteSkill,
  findSkill,
  findSkillFile,
  importSkills,
  listSkills,
  updateSkill,
} from "@/modules/skills/services/skill.service";
import { respond } from "@/shared/http";
import type { AppEnv } from "@/shared/types/app.types";
import { validate } from "@/shared/validator";

const skillFileQuerySchema = z.object({ path: z.string().trim().min(1) });

export const skillsRoutes = new Hono<AppEnv>()
  .use(requireOrganization)
  .get("/", validate("query", listSkillsSchema), (c) =>
    respond(c, listSkills(c.var.organizationId, c.req.valid("query"))),
  )
  .post("/", validate("json", createSkillSchema), (c) =>
    respond(c, createSkill(c.var.organizationId, c.req.valid("json")), 201),
  )
  .post("/import", validate("json", importSkillsSchema), (c) =>
    respond(c, importSkills(c.var.organizationId, c.req.valid("json"))),
  )
  .get("/:slug", (c) => respond(c, findSkill(c.var.organizationId, c.req.param("slug"))))
  .patch("/:slug", validate("json", updateSkillSchema), async (c) =>
    respond(c, updateSkill(c.var.organizationId, c.req.param("slug"), c.req.valid("json"))),
  )
  .delete("/:slug", (c) => respond(c, deleteSkill(c.var.organizationId, c.req.param("slug"))))
  .get("/:slug/files", validate("query", skillFileQuerySchema), (c) =>
    respond(c, findSkillFile(c.var.organizationId, c.req.param("slug"), c.req.valid("query").path)),
  );
