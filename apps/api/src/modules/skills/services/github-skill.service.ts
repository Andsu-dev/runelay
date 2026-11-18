import { isUtf8 } from "node:buffer";
import {
  attempt,
  attemptSync,
  fail,
  type GithubSkillCandidate,
  ok,
  type Result,
  SKILL_DOCUMENT_LIMIT,
} from "@runelay/shared";
import { z } from "zod";
import { installSkillDocument } from "@/modules/skills/services/skill.service";

const ENTRY_FILE = "SKILL.md";
const GITHUB_API = "https://api.github.com/repos";
const GITHUB_RAW = "https://raw.githubusercontent.com";
const TREE_LIMIT = 8 * 1024 * 1024;
const PACKAGE_LIMIT = 5 * 1024 * 1024;
const FILE_LIMIT = 500_000;
const MAX_FILES = 200;
const TIMEOUT_MS = 25_000;
const SHA = /^[a-f0-9]{40}$/;
const REPOSITORY_PART = /^[a-z0-9_.-]+$/i;
const REF = /^[a-z0-9_./-]+$/i;
const UNSAFE_FILE_CHARACTERS = /[\\:*?"<>|\p{Cc}]/u;

const commitSchema = z.object({
  sha: z.string().regex(SHA),
  commit: z.object({ tree: z.object({ sha: z.string().regex(SHA) }) }),
});
const treeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.string(),
      size: z.number().int().nonnegative().optional(),
    }),
  ),
});

type TreeEntry = z.infer<typeof treeSchema>["tree"][number];

const safeSegment = (part: string) => part !== "" && part !== "." && part !== "..";

const parseSource = (source: string) => {
  let segments: string[];
  let selector: string | undefined;
  let workspaceRef = "HEAD";
  let folder: string | undefined;
  const url = URL.parse(source);
  if (url) {
    if (url.protocol !== "https:" || url.port || url.username || url.password) return;
    segments = url.pathname.replace(/\/$/, "").split("/").slice(1);
    if (!segments.every(safeSegment)) return;
    if (url.hostname === "skills.sh") {
      if (segments.length !== 3) return;
      selector = segments.pop();
    } else if (url.hostname === "github.com") {
      const [, , kind, ref, ...path] = segments;
      if (kind) {
        if ((kind !== "tree" && kind !== "blob") || !ref || path.some((part) => !safeSegment(part))) return;
        if (kind === "blob" && path.pop() !== ENTRY_FILE) return;
        workspaceRef = decodeURIComponent(ref);
        folder = path.map((part) => decodeURIComponent(part)).join("/");
      }
    } else return;
  } else {
    const [repository, name, extra] = source.split("@");
    if (!repository || extra !== undefined || name === "") return;
    segments = repository.split("/");
    if (segments.length !== 2) return;
    selector = name;
  }
  const [owner, rawRepo] = segments;
  const repo = rawRepo?.replace(/\.git$/i, "");
  if (!owner || !repo || ![owner, repo].every((part) => safeSegment(part) && REPOSITORY_PART.test(part))) return;
  if (!REF.test(workspaceRef) || !workspaceRef.split("/").every(safeSegment)) return;
  return { repository: `${owner}/${repo}`, repo, ref: workspaceRef, folder, selector };
};

const download = async (url: string, limit: number, signal: AbortSignal) => {
  const response = await fetch(url, {
    redirect: "error",
    signal,
    headers: { "user-agent": "runelay-skill-installer" },
  });
  if (!response.ok || !response.body) throw new Error(`GitHub returned HTTP ${response.status}.`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("The GitHub download exceeds the size limit.");
    }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks, total);
};

const regularFile = (entry: TreeEntry) => entry.type === "blob" && (entry.mode === "100644" || entry.mode === "100755");

const loadRepository = async (source: string, signal: AbortSignal) => {
  const parsed = attemptSync(() => parseSource(source), "INVALID_INPUT");
  if (!parsed.data) return fail("INVALID_INPUT", "Use owner/repo, a GitHub skill link or a skills.sh skill link.");
  const { repository, repo, ref, folder, selector } = parsed.data;
  const loaded = await attempt(async () => {
    const api = `${GITHUB_API}/${repository}`;
    const commit = commitSchema.parse(
      JSON.parse((await download(`${api}/commits/${encodeURIComponent(ref)}`, TREE_LIMIT, signal)).toString()),
    );
    const listing = treeSchema.parse(
      JSON.parse(
        (await download(`${api}/git/trees/${commit.commit.tree.sha}?recursive=1`, TREE_LIMIT, signal)).toString(),
      ),
    );
    if (listing.truncated)
      throw new Error("GitHub truncated the repository tree. The skill could not be read in full.");
    const entries = listing.tree.filter(regularFile);
    const candidates = entries
      .filter(
        ({ path }) =>
          !UNSAFE_FILE_CHARACTERS.test(path) &&
          path.split("/").every(safeSegment) &&
          path.split("/").at(-1) === ENTRY_FILE,
      )
      .map(({ path }): GithubSkillCandidate => {
        const parts = path.split("/").slice(0, -1);
        return { name: parts.at(-1) ?? repo, path: parts.join("/") || "." };
      });
    return { entries, candidates, sha: commit.sha };
  }, "UPSTREAM_FAILED");
  if (loaded.error) return loaded;
  const candidates = loaded.data.candidates.filter(
    (candidate) =>
      (folder === undefined || candidate.path === (folder || ".")) &&
      (selector === undefined || candidate.name === selector),
  );
  return ok({ ...loaded.data, repository, candidates, allCandidates: loaded.data.candidates });
};

export const discoverGithubSkills = async (source: string): Promise<Result<GithubSkillCandidate[]>> => {
  const result = await loadRepository(source, AbortSignal.timeout(TIMEOUT_MS));
  return result.error ? result : ok(result.data.candidates);
};

export const installGithubSkill = async (organizationId: string, source: string, selector?: string) => {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const result = await loadRepository(source, signal);
  if (result.error) return result;
  const { repository, sha, candidates, allCandidates, entries } = result.data;
  const exactPath = candidates.find(({ path }) => path === selector);
  const matches = exactPath
    ? [exactPath]
    : candidates.filter(({ name }) => selector === undefined || name === selector);
  if (matches.length === 0) return fail("SKILL_NOT_FOUND", "No matching SKILL.md was found in this repository.");
  if (matches.length !== 1) return fail("INVALID_INPUT", "Choose one skill from the repository by its name or path.");
  const [candidate] = matches as [GithubSkillCandidate];
  const prefix = candidate.path === "." ? "" : `${candidate.path}/`;
  const nested = allCandidates
    .filter(({ path }) => path !== candidate.path && path.startsWith(prefix))
    .map(({ path }) => `${path}/`);
  const assets = entries.filter(({ path, size }) => {
    if (!path.startsWith(prefix) || nested.some((folder) => path.startsWith(folder))) return false;
    const relative = path.slice(prefix.length);
    return (
      relative !== ENTRY_FILE &&
      relative.length <= 300 &&
      relative.split("/").every((part) => safeSegment(part) && !part.startsWith(".")) &&
      !UNSAFE_FILE_CHARACTERS.test(relative) &&
      (size ?? 0) <= FILE_LIMIT
    );
  });
  if (assets.length > MAX_FILES || assets.reduce((sum, { size }) => sum + (size ?? 0), 0) > PACKAGE_LIMIT)
    return fail("INVALID_INPUT", "This skill exceeds the Runelay package size or file count limit.");

  const downloaded = await attempt(async () => {
    const sourceUrl = `${GITHUB_RAW}/${repository}/${sha}`;
    const read = (path: string, limit: number) =>
      download(`${sourceUrl}/${path.split("/").map(encodeURIComponent).join("/")}`, limit, signal);
    const entry = await read(`${prefix}${ENTRY_FILE}`, SKILL_DOCUMENT_LIMIT);
    const content = new TextDecoder("utf-8", { fatal: true }).decode(entry);
    const files = [];
    let total = entry.byteLength;
    for (const { path } of assets) {
      const bytes = await read(path, Math.min(FILE_LIMIT, PACKAGE_LIMIT - total));
      total += bytes.byteLength;
      if (bytes.includes(0) || !isUtf8(bytes)) continue;
      files.push({ path: path.slice(prefix.length), content: bytes.toString("utf8") });
    }
    return { content, files };
  }, "UPSTREAM_FAILED");
  return downloaded.error
    ? downloaded
    : installSkillDocument(organizationId, { filename: candidate.name, slug: candidate.name, ...downloaded.data });
};
