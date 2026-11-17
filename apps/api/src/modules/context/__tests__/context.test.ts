import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type { ContextBriefView, ContextHitView } from "@runelay/shared";
import { db } from "@/db/connection";
import { BRIEF_MAX_CHARS, BRIEF_TRUNCATED, PINNED_TRUNCATED } from "@/modules/context/constants/context.constants";
import { buildBrief, pinnedInstructions, searchContext } from "@/modules/context/services/context.service";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let owner: TestAccount;
let stranger: TestAccount;
let ownerKey: string;

const post = (account: TestAccount, path: string, json: unknown) =>
  call(path, { method: "POST", cookie: account.cookie, json });

const search = async (account: TestAccount, query: string) =>
  call(`/v1/context/search?${query}`, { cookie: account.cookie });

const brief = async (account: TestAccount, query = "") =>
  (await body<ContextBriefView>(await call(`/v1/context/brief${query}`, { cookie: account.cookie }))).data;

beforeAll(async () => {
  resetDatabase();
  owner = await signUp("Context Owner");
  stranger = await signUp("Context Stranger");
  ownerKey = (await createApiKey(owner)).key;
  await post(owner, "/v1/memories/import", {
    memories: [
      { slug: "golden-rule", name: "Golden", description: "Never deploy", type: "feedback", body: "x", pinned: true },
      { slug: "quiet-rule", name: "Quiet", type: "feedback", body: "y", pinned: true },
      { slug: "how-to-work", name: "Work style", description: "Short replies", type: "feedback", body: "zorbix" },
      { slug: "about-me", name: "About", type: "user", body: "zorbix person" },
      { slug: "project-a", name: "Project A", type: "project", body: "zorbix project" },
      { slug: "ref-a", name: "Ref A", type: "reference", body: "plain" },
    ],
  });
  await post(owner, "/v1/skills/import", {
    skills: [
      { slug: "zorbix-skill", name: "Zorbix", description: "Handles zorbix. Second sentence.", body: "zorbix" },
      { slug: "silent-skill", name: "Silent", body: "zorbix" },
      { slug: "off-skill", name: "Off", body: "zorbix", enabled: false },
    ],
  });
});

afterEach(() => {
  mock.restore();
});

describe("context search", () => {
  test("requires authentication and a query", async () => {
    expect((await call("/v1/context/search?query=zorbix")).status).toBe(401);
    expect((await search(owner, "")).status).toBe(400);
  });

  test("interleaves memory and skill hits, skipping disabled skills", async () => {
    const response = await call("/v1/context/search?query=zorbix&limit=30", { bearer: ownerKey });
    const { data } = await body<ContextHitView[]>(response);
    expect(data.filter((hit) => hit.kind === "memory")).toHaveLength(3);
    expect(
      data
        .filter((hit) => hit.kind === "skill")
        .map((hit) => hit.slug)
        .sort(),
    ).toEqual(["silent-skill", "zorbix-skill"]);
    expect(data[0]?.kind).toBe("memory");
    expect(data[1]?.kind).toBe("skill");
    expect(data.find((hit) => hit.slug === "zorbix-skill")?.snippet).toContain("**");
  });

  test("filters by kind and limit", async () => {
    const memories = (await body<ContextHitView[]>(await search(owner, "query=zorbix&kind=memory"))).data;
    expect(memories.every((hit) => hit.kind === "memory")).toBe(true);
    expect(memories).toHaveLength(3);
    const skills = (await body<ContextHitView[]>(await search(owner, "query=zorbix&kind=skill"))).data;
    expect(skills.every((hit) => hit.kind === "skill")).toBe(true);
    const limited = (await body<ContextHitView[]>(await search(owner, "query=zorbix&limit=1"))).data;
    expect(limited).toHaveLength(1);
  });

  test("returns nothing for queries without tokens and for other organizations", async () => {
    expect((await body<ContextHitView[]>(await search(owner, "query=%3F%3F"))).data).toEqual([]);
    expect((await body<ContextHitView[]>(await search(stranger, "query=zorbix"))).data).toEqual([]);
  });
});

describe("context brief", () => {
  test("renders pinned rules, grouped memories and enabled skills", async () => {
    const data = await brief(owner, "?client=codex");
    expect(data.client).toBe("codex");
    expect(data.pinnedCount).toBe(2);
    expect(data.skillCount).toBe(2);
    expect(data.markdown).toContain("- **Golden** (`golden-rule`): Never deploy");
    expect(data.markdown).toContain("- **Quiet** (`quiet-rule`)\n");
    expect(data.markdown).toContain("- Work style (`how-to-work`): Short replies");
    expect(data.markdown).toContain("- About (`about-me`)\n");
    for (const title of ["### Como trabalhar", "### Sobre a pessoa", "### Projetos", "### Referências"]) {
      expect(data.markdown.split(title)).toHaveLength(2);
    }
    expect(data.markdown.indexOf("### Como trabalhar")).toBeLessThan(data.markdown.indexOf("### Sobre a pessoa"));
    expect(data.markdown).toContain("- Zorbix (`zorbix-skill`): Handles zorbix.\n");
    expect(data.markdown).toContain("- Silent (`silent-skill`)\n");
    expect(data.markdown).not.toContain("off-skill");
    expect(data.markdown).not.toContain(BRIEF_TRUNCATED);
  });

  test("defaults the client and renders an empty organization", async () => {
    const data = await brief(stranger);
    expect(data).toMatchObject({ client: "claude", pinnedCount: 0, skillCount: 0 });
    expect(data.markdown).not.toContain("## Regras de ouro");
    expect(data.markdown).not.toContain("## Índice de memórias");
    expect(data.markdown).not.toContain("## Habilidades");
    expect(data.markdown).toContain("## Como usar");
    expect((await call("/v1/context/brief?client=vim", { cookie: stranger.cookie })).status).toBe(400);
  });

  test("truncates memories and skills to fit the budget", async () => {
    const crowded = await signUp("Crowded");
    const description = "d".repeat(400);
    await post(crowded, "/v1/memories/import", {
      memories: Array.from({ length: 40 }, (_, index) => ({
        slug: `bulk-${index}`,
        name: `Bulk ${index}`,
        description,
        type: "project",
        body: "",
      })),
    });
    const memoriesOnly = await brief(crowded);
    expect(memoriesOnly.markdown).toContain(BRIEF_TRUNCATED);
    expect(memoriesOnly.markdown.length).toBeLessThanOrEqual(BRIEF_MAX_CHARS);
    await post(crowded, "/v1/skills/import", {
      skills: Array.from({ length: 80 }, (_, index) => ({
        slug: `skill-${index}`,
        name: `Skill ${index}`,
        description: "s".repeat(300),
        body: "",
      })),
    });
    const both = await brief(crowded);
    expect(both.markdown.split(BRIEF_TRUNCATED)).toHaveLength(3);
    expect(both.markdown.length).toBeLessThanOrEqual(BRIEF_MAX_CHARS);
    expect(both.skillCount).toBe(80);
  });

  test("pinnedInstructions renders only pinned rules, one line each without description", () => {
    const rendered = pinnedInstructions(owner.organizationId, 2_000);
    expect(rendered.data).toBe("## Regras de ouro\n- Golden (golden-rule)\n- Quiet (quiet-rule)");
    expect(pinnedInstructions(stranger.organizationId, 2_000).data).toBe("");
  });

  test("pinnedInstructions ends with a pointer to search_context when rules do not fit", () => {
    const rendered = pinnedInstructions(owner.organizationId, 30);
    expect(rendered.data).toBe(`## Regras de ouro\n${PINNED_TRUNCATED}`);
  });
});

describe("storage failures", () => {
  test("search, brief and pinned instructions return STORAGE_FAILED", () => {
    spyOn(db, "query").mockImplementation(() => {
      throw new Error("disk on fire");
    });
    const org = owner.organizationId;
    expect(searchContext(org, { query: "zorbix", limit: 5 }).error?.code).toBe("STORAGE_FAILED");
    expect(buildBrief(org, "claude").error?.code).toBe("STORAGE_FAILED");
    expect(pinnedInstructions(org, 2_000).error?.code).toBe("STORAGE_FAILED");
  });
});
