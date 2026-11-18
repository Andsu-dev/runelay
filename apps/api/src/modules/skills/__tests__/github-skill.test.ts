import { afterEach, beforeAll, expect, spyOn, test } from "bun:test";
import type { GithubSkillCandidate, SkillView } from "@runelay/shared";
import { body, call, createApiKey, signUp, type TestAccount } from "../../../../test/helpers";

const COMMIT = "a".repeat(40);
const TREE = "b".repeat(40);
const REPOSITORY = "examples/agent-skills";
const SKILL_PATH = "skills/review";
const AUTHORS = [
  { name: "agent-skills", path: "." },
  { name: "review", path: SKILL_PATH },
  { name: "test", path: "skills/test" },
] as const;

const file = (path: string, size = 20) => ({ path, size, type: "blob", mode: "100644" });
const entries = [
  file("SKILL.md"),
  file("README.md"),
  file(`${SKILL_PATH}/SKILL.md`),
  file(`${SKILL_PATH}/references/pattern notes.md`),
  file(`${SKILL_PATH}/sample.png`),
  file(`${SKILL_PATH}/.runelay`),
  { ...file(`${SKILL_PATH}/link`), mode: "120000" },
  file("skills/test/SKILL.md"),
  { path: "skills", type: "tree", mode: "040000" },
];

let account: TestAccount;
let apiKey: string;
let restore: (() => void) | undefined;

beforeAll(async () => {
  account = await signUp("Github Skills");
  apiKey = (await createApiKey(account, "skills-cli")).key;
});

afterEach(() => {
  restore?.();
  restore = undefined;
});

const fakeGithub = ({
  tree = entries,
  truncated = false,
  commitStatus = 200,
  skillDocument = "---\nname: Review changes\ndescription: Review a pull request.\n---\n\nRead the diff.",
} = {}) => {
  const urls: string[] = [];
  const spy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input instanceof Request ? input.url : input);
        urls.push(url.href);
        expect(init?.redirect).toBe("error");
        if (url.hostname === "api.github.com" && url.pathname.includes("/commits/")) {
          return Response.json({ sha: COMMIT, commit: { tree: { sha: TREE } } }, { status: commitStatus });
        }
        if (url.hostname === "api.github.com" && url.pathname.endsWith(`/git/trees/${TREE}`)) {
          return Response.json({ tree, truncated });
        }
        if (url.hostname === "raw.githubusercontent.com" && url.pathname.startsWith(`/${REPOSITORY}/${COMMIT}/`)) {
          const path = decodeURIComponent(url.pathname.slice(`/${REPOSITORY}/${COMMIT}/`.length));
          switch (path) {
            case "SKILL.md":
              return new Response("Root instructions");
            case "✨/SKILL.md":
            case `${SKILL_PATH}/SKILL.md`:
              return new Response(skillDocument);
            case "README.md":
            case `${SKILL_PATH}/references/pattern notes.md`:
              return new Response("Reference content");
            case `${SKILL_PATH}/sample.png`:
              return new Response(new Uint8Array([137, 80, 78, 71]));
          }
        }
        throw new Error(`Unexpected GitHub request: ${url}`);
      },
      { preconnect: globalThis.fetch.preconnect },
    ),
  );
  restore = () => spy.mockRestore();
  return urls;
};

const discover = (source: string) =>
  call("/v1/skills/github/discover", { method: "POST", cookie: account.cookie, json: { source } });

const install = (source: string, skill?: string) =>
  call("/v1/skills/github/install", { method: "POST", bearer: apiKey, json: { source, skill } });

test("discovers public skills from shorthand, GitHub folders and files, and skills.sh", async () => {
  const urls = fakeGithub();
  const all = await body<GithubSkillCandidate[]>(await discover(REPOSITORY));
  expect(all.data).toEqual([...AUTHORS]);
  for (const source of [
    `${REPOSITORY}@review`,
    `https://github.com/${REPOSITORY}/tree/main/${SKILL_PATH}/`,
    `https://github.com/${REPOSITORY}/blob/main/${SKILL_PATH}/SKILL.md`,
    `https://skills.sh/${REPOSITORY}/review`,
  ]) {
    const result = await body<GithubSkillCandidate[]>(await discover(source));
    expect(result.data).toEqual([AUTHORS[1]]);
  }
  expect(urls).toContain(`https://api.github.com/repos/${REPOSITORY}/commits/main`);
});

test("installs the selected skill and its text assets into the authenticated organization", async () => {
  const urls = fakeGithub();
  const result = await install(REPOSITORY, SKILL_PATH);
  expect(result.status).toBe(201);
  expect((await body<SkillView>(result)).data).toMatchObject({
    slug: "review",
    name: "Review changes",
    description: "Review a pull request.",
    body: "Read the diff.",
    fileCount: 1,
    enabled: true,
  });
  expect(urls).toContain(
    `https://raw.githubusercontent.com/${REPOSITORY}/${COMMIT}/${SKILL_PATH}/references/pattern%20notes.md`,
  );
  const asset = await call("/v1/skills/review/files?path=references%2Fpattern%20notes.md", { cookie: account.cookie });
  expect((await body(asset)).data).toEqual({ path: "references/pattern notes.md", content: "Reference content" });
  const duplicate = await install(REPOSITORY, "review");
  expect(duplicate.status).toBe(409);
  const other = await signUp("Other Skills Owner");
  expect((await call("/v1/skills/review", { cookie: other.cookie })).status).toBe(404);
});

test("installs a root skill without pulling other skill folders", async () => {
  fakeGithub();
  const result = await install(`https://github.com/${REPOSITORY}/blob/main/SKILL.md`);
  expect(result.status).toBe(201);
  expect((await body<SkillView>(result)).data).toMatchObject({
    slug: "agent-skills",
    name: "agent-skills",
    description: "",
    body: "Root instructions",
    files: [{ path: "README.md", size: 17 }],
  });
});

test("requires an explicit choice from a repository with multiple skills", async () => {
  fakeGithub();
  expect((await install(REPOSITORY)).status).toBe(400);
  expect((await install(REPOSITORY, "absent")).status).toBe(404);
});

test.each([
  "http://github.com/examples/agent-skills",
  "https://example.test/examples/agent-skills",
  "https://outside@github.com/examples/agent-skills",
  "https://skills.sh/examples/agent-skills",
  "https://github.com/examples/agent-skills/issues/1",
  "https://github.com/examples/agent-skills/blob/main/README.md",
  "https://github.com/examples/agent-skills/tree/%ZZ",
  "https://github.com/examples/agent-skills/tree/%20",
  "examples/agent-skills@",
  "examples",
  "*/agent-skills",
])("rejects the source %s before fetching", async (source) => {
  const urls = fakeGithub();
  expect((await discover(source)).status).toBe(400);
  expect(urls).toEqual([]);
});

test("rejects authentication-free installs and validates the request", async () => {
  const anonymous = await call("/v1/skills/github/install", { method: "POST", json: { source: REPOSITORY } });
  expect(anonymous.status).toBe(401);
  expect((await discover("")).status).toBe(400);
});

test("reports a missing repository and a truncated tree", async () => {
  fakeGithub({ commitStatus: 404 });
  expect((await discover(REPOSITORY)).status).toBe(502);
  restore?.();
  fakeGithub({ truncated: true });
  expect((await discover(REPOSITORY)).status).toBe(502);
});

test("refuses oversized packages and downloads without writing a partial skill", async () => {
  fakeGithub({
    tree: [
      file(`${SKILL_PATH}/SKILL.md`),
      ...Array.from({ length: 11 }, (_, index) => file(`${SKILL_PATH}/${index}.txt`, 500_000)),
    ],
  });
  expect((await install(REPOSITORY)).status).toBe(400);
  restore?.();
  fakeGithub({ skillDocument: "a".repeat(200_001) });
  const huge = await install(REPOSITORY, "review");
  expect(huge.status).toBe(502);
  expect((await body(huge)).error?.message).toContain("size limit");
});

test("reports a folder that cannot become a skill slug", async () => {
  fakeGithub({ tree: [file("✨/SKILL.md")] });
  expect((await install(REPOSITORY)).status).toBe(400);
});

test("adds a Markdown or text document with the same authentication and slug protection", async () => {
  const upload = (filename: string, content: string) =>
    call("/v1/skills/upload", { method: "POST", bearer: apiKey, json: { filename, content } });
  const markdown = "---\nname: Feedback Guide\ndescription: Review notes.\n---\n\nUse actionable feedback.";
  const result = await upload("SKILL.md", markdown);
  expect(result.status).toBe(201);
  expect((await body<SkillView>(result)).data).toMatchObject({
    slug: "feedback-guide",
    name: "Feedback Guide",
    description: "Review notes.",
    body: "Use actionable feedback.",
  });
  expect((await upload("Feedback Guide.txt", "replacement")).status).toBe(409);

  const text = await upload("Anotações.txt", "Prefer simple configuration.");
  expect(text.status).toBe(201);
  expect((await body<SkillView>(text)).data).toMatchObject({
    slug: "anotacoes",
    name: "Anotações",
    body: "Prefer simple configuration.",
  });
  expect((await upload("asset.pdf", "unsupported")).status).toBe(400);
  expect((await upload("blank.md", " ")).status).toBe(400);
});
