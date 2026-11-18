import {
  createSkillSchema,
  exportSkillsSchema,
  githubSkillSourceSchema,
  importSkillsSchema,
  installGithubSkillSchema,
  listSkillsSchema,
  updateSkillSchema,
  uploadSkillSchema,
} from "@runelay/shared";
import { Hono } from "hono";
import { z } from "zod";
import { requireOrganization } from "@/modules/auth/middlewares/authenticate";
import { discoverGithubSkills, installGithubSkill } from "@/modules/skills/services/github-skill.service";
import {
  createSkill,
  deleteSkill,
  exportSkills,
  findSkill,
  findSkillFile,
  importSkills,
  installSkillDocument,
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
  .post("/export", validate("json", exportSkillsSchema), (c) =>
    respond(c, exportSkills(c.var.organizationId, c.req.valid("json").slugs)),
  )
  .post("/import", validate("json", importSkillsSchema), (c) =>
    respond(c, importSkills(c.var.organizationId, c.req.valid("json"))),
  )
  .post("/upload", validate("json", uploadSkillSchema), (c) => {
    const { filename, content } = c.req.valid("json");
    const name = filename.slice(0, filename.lastIndexOf("."));
    return respond(c, installSkillDocument(c.var.organizationId, { filename: name, content }), 201);
  })
  .post("/github/discover", validate("json", githubSkillSourceSchema), async (c) =>
    respond(c, await discoverGithubSkills(c.req.valid("json").source)),
  )
  .post("/github/install", validate("json", installGithubSkillSchema), async (c) => {
    const { source, skill } = c.req.valid("json");
    return respond(c, await installGithubSkill(c.var.organizationId, source, skill), 201);
  })
  .get("/:slug", (c) => respond(c, findSkill(c.var.organizationId, c.req.param("slug"))))
  .patch("/:slug", validate("json", updateSkillSchema), async (c) =>
    respond(c, updateSkill(c.var.organizationId, c.req.param("slug"), c.req.valid("json"))),
  )
  .delete("/:slug", (c) => respond(c, deleteSkill(c.var.organizationId, c.req.param("slug"))))
  .get("/:slug/files", validate("query", skillFileQuerySchema), (c) =>
    respond(c, findSkillFile(c.var.organizationId, c.req.param("slug"), c.req.valid("query").path)),
  );
