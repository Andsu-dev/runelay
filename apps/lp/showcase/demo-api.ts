import { DEMO_API_KEYS, DEMO_HEALTH, DEMO_MEMORIES, DEMO_SKILLS, DEMO_SOURCES } from "./demo-data";

const state = {
  sources: structuredClone(DEMO_SOURCES),
  skills: structuredClone(DEMO_SKILLS),
  memories: structuredClone(DEMO_MEMORIES),
  apiKeys: structuredClone(DEMO_API_KEYS),
};

const ok = (data: unknown) => new Response(JSON.stringify({ data, error: null }), { headers: { "content-type": "application/json" } });

const notFound = () =>
  new Response(JSON.stringify({ data: null, error: { code: "NOT_FOUND", message: "Not found", status: 404 } }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });

const pageOf = <T,>(items: T[]) => ({ items, total: items.length, nextCursor: null });

const summary = () => ({
  total: state.sources.length,
  tools: state.sources.reduce((sum, source) => sum + (source.enabled ? source.toolCount : 0), 0),
  attention: state.sources.filter((source) => source.enabled && source.status === "needs_auth").length,
});

const matches = (text: string, query: string | null) => !query || text.toLowerCase().includes(query.toLowerCase());

const respond = (method: string, url: URL, body: Record<string, unknown>) => {
  const [resource, id] = url.pathname.replace(/^\/v1\//, "").split("/").map(decodeURIComponent);
  const params = url.searchParams;

  if (resource === "sources") {
    if (method === "GET" && id === "summary") return ok(summary());
    if (method === "GET" && !id) {
      const status = params.get("status");
      return ok(status ? state.sources.filter((source) => source.status === status) : state.sources);
    }
    const target = state.sources.find((source) => source.name === id);
    if (!target) return notFound();
    if (method === "PATCH") return ok(Object.assign(target, body));
    if (method === "DELETE") {
      state.sources = state.sources.filter((source) => source !== target);
      return ok(null);
    }
    return ok(target);
  }

  if (resource === "skills") {
    if (method === "GET" && !id) return ok(pageOf(state.skills.filter((skill) => matches(skill.name, params.get("query")))));
    const target = state.skills.find((skill) => skill.slug === id);
    if (!target) return notFound();
    if (method === "PATCH") Object.assign(target, body);
    return ok({ ...target, body: "", files: [] });
  }

  if (resource === "memories") {
    if (method === "GET" && id === "health") return ok({ ...DEMO_HEALTH, total: state.memories.length });
    if (method === "GET" && !id) {
      const type = params.get("type");
      const pinned = params.get("pinned") === "true";
      return ok(
        pageOf(
          state.memories.filter(
            (memory) =>
              matches(memory.name, params.get("query")) && (!type || memory.type === type) && (!pinned || memory.pinned),
          ),
        ),
      );
    }
    return notFound();
  }

  if (resource === "api-keys") {
    if (method === "GET" && !id) return ok(state.apiKeys);
    if (method === "DELETE") {
      state.apiKeys = state.apiKeys.filter((key) => key.id !== id);
      return ok(null);
    }
  }

  return notFound();
};

export const installDemoApi = () => {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith("/v1/")) return realFetch(input, init);
    const method = (init?.method ?? "GET").toUpperCase();
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    await new Promise((resolve) => setTimeout(resolve, 260));
    return respond(method, url, body);
  };
};
