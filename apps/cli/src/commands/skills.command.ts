import { basename, isAbsolute } from "node:path";
import { parseArgs, stripVTControlCharacters } from "node:util";
import {
  attempt,
  attemptSync,
  fail,
  ok,
  type Result,
  SKILL_DOCUMENT_LIMIT,
  skillDocumentFilenameSchema,
} from "@runelay/shared";
import { printJson, wantsJson } from "@/lib/json-output";
import { runMenu } from "@/lib/menu";
import { interactive } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";
import { discoverGithubSkills, installGithubSkill, uploadSkill } from "@/services/runelay-api.service";

const USAGE = "Usage: runelay skills add <owner/repo, URL or .md/.txt file> [--skill <name or path> | --list]";

export const skillsCommand = async ([action, ...args]: string[]): Promise<Result<null>> => {
  const parsed = attemptSync(
    () =>
      parseArgs({
        args,
        allowPositionals: true,
        options: { skill: { type: "string", short: "s" }, list: { type: "boolean" }, json: { type: "boolean" } },
      }),
    "INVALID_INPUT",
  );
  if (action !== "add" || parsed.error || parsed.data.positionals.length !== 1) return fail("INVALID_INPUT", USAGE);
  const [source] = parsed.data.positionals as [string];
  const { list, skill } = parsed.data.values;
  if (list && skill) return fail("INVALID_INPUT", USAGE);

  const connection = resolveConnection();
  if (connection.error) return connection;
  const filename = basename(source);
  const local =
    source.startsWith(".") ||
    isAbsolute(source) ||
    (!source.includes("/") && skillDocumentFilenameSchema.safeParse(filename).success);
  if (local) {
    if (list || skill || !skillDocumentFilenameSchema.safeParse(filename).success) return fail("INVALID_INPUT", USAGE);
    const file = Bun.file(source);
    if (!(await file.exists()) || file.size === 0 || file.size > SKILL_DOCUMENT_LIMIT)
      return fail("INVALID_INPUT", "Choose a readable Markdown or TXT file up to 200 KB.");
    const decoded = await attempt(
      async () => new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()),
      "INVALID_INPUT",
    );
    if (decoded.error) return decoded;
    const installed = await uploadSkill(connection.data, filename, decoded.data);
    if (installed.error) return installed;
    printInstalled(installed.data, args);
    return ok(null);
  }
  let selected = skill;
  if (!selected) {
    const discovered = await discoverGithubSkills(connection.data, source);
    if (discovered.error) return discovered;
    const candidates = discovered.data;
    if (list) {
      if (wantsJson(args)) printJson({ ok: true, skills: candidates });
      else for (const { name, path } of candidates) console.log(`${name}\t${path}`);
      return ok(null);
    }
    if (!candidates.length) return fail("SKILL_NOT_FOUND", "No SKILL.md was found in this repository.");
    if (candidates.length === 1) selected = candidates[0]?.path;
    else {
      if (!interactive || wantsJson(args))
        return fail("INVALID_INPUT", "This repository has multiple skills. Use --list and select one with --skill.");
      const choice = await runMenu(candidates.map(({ name, path }) => ({ id: path, label: name, summary: path })));
      if (!choice) return ok(null);
      selected = choice.id;
    }
  }

  const installed = await installGithubSkill(connection.data, source, selected);
  if (installed.error) return installed;
  printInstalled(installed.data, args);
  return ok(null);
};

const printInstalled = (
  { name, slug, fileCount }: { name: string; slug: string; fileCount: number },
  args: string[],
) => {
  if (wantsJson(args)) printJson({ ok: true, skill: { name, slug, fileCount } });
  else console.log(`Added ${stripVTControlCharacters(name).replace(/\s+/g, " ")} (${slug}) to Runelay.`);
};
