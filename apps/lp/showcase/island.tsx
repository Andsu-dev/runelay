import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { type MouseEvent, type ReactNode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { meQuery } from "@/modules/auth/api/session.api";
import { memoriesQuery, memoryHealthQuery } from "@/modules/memory/api/memories.api";
import { HEALTH_DAYS } from "@/modules/memory/constants/memory.constants";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { skillsQuery } from "@/modules/skills/api/skills.api";
import { needsAuthQuery, sourcesQuery, sourcesSummaryQuery } from "@/modules/sources/api/sources.api";
import { versionQuery } from "@/modules/system/api/system.api";
import { brandIcon } from "./brand-icons";
import { installDemoApi } from "./demo-api";
import {
  DEMO_API_KEYS,
  DEMO_HEALTH,
  DEMO_ME,
  DEMO_MEMORIES,
  DEMO_ONBOARDING,
  DEMO_SKILLS,
  DEMO_SOURCES,
  DEMO_VERSION,
  page,
} from "./demo-data";
import css from "./showcase.css?inline";

const PROPERTY_RULE = /@property\s+[^{]+\{[^}]*\}/g;

const sheet = new CSSStyleSheet();
sheet.replaceSync(
  css
    .replace(/@import\s+url\([^)]*\)\s*;?/g, "")
    .replace(/:root\b/g, ":host")
    .replace(/@media\s*\(((?:min-|max-)?width[^)]*)\)/g, "@container showcase ($1)")
    .replace(/100dvh/g, "var(--canvas-h, 100dvh)"),
);

const properties = document.createElement("style");
properties.textContent = (css.match(PROPERTY_RULE) ?? []).join("\n");
document.head.append(properties);

installDemoApi();

export const createDemoClient = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false, refetchOnWindowFocus: false } },
  });
  client.setQueryData(meQuery.queryKey, DEMO_ME);
  client.setQueryData(versionQuery.queryKey, DEMO_VERSION);
  client.setQueryData(onboardingQuery.queryKey, DEMO_ONBOARDING);
  client.setQueryData(sourcesQuery.queryKey, DEMO_SOURCES);
  client.setQueryData(
    needsAuthQuery.queryKey,
    DEMO_SOURCES.filter((source) => source.status === "needs_auth"),
  );
  client.setQueryData(sourcesSummaryQuery.queryKey, {
    total: DEMO_SOURCES.length,
    tools: DEMO_SOURCES.reduce((sum, source) => sum + source.toolCount, 0),
    attention: DEMO_SOURCES.filter((source) => source.status === "needs_auth").length,
  });
  client.setQueryData(skillsQuery("").queryKey, page(DEMO_SKILLS));
  client.setQueryData(memoriesQuery({ query: "" }).queryKey, page(DEMO_MEMORIES));
  client.setQueryData(memoryHealthQuery(HEALTH_DAYS).queryKey, DEMO_HEALTH);
  client.setQueryData(apiKeysQuery.queryKey, DEMO_API_KEYS);
  return client;
};

const darkQuery = matchMedia("(prefers-color-scheme: dark)");

const useDark = () =>
  useSyncExternalStore(
    (listener) => {
      darkQuery.addEventListener("change", listener);
      return () => darkQuery.removeEventListener("change", listener);
    },
    () => darkQuery.matches,
  );

const ALLOWED = '[role="switch"], [aria-expanded]:not([aria-haspopup])';

const guard = (event: MouseEvent) => {
  const control = (event.target as Element).closest("a, button, [role='button']");
  if (!control || control.matches(ALLOWED)) return;
  const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  if (control.tagName === "A" && !modified) return;
  event.preventDefault();
  event.stopPropagation();
};

const blockPopups = (event: { target: EventTarget; preventDefault: () => void; stopPropagation: () => void }) => {
  if (!(event.target as Element).closest("[aria-haspopup]")) return;
  event.preventDefault();
  event.stopPropagation();
};

function Island({ children, className }: { children: ReactNode; className?: string }) {
  const dark = useDark();
  return (
    <div
      className={`showcase-root ${dark ? "dark" : ""} ${className ?? ""}`}
      onClickCapture={guard}
      onAuxClickCapture={guard}
      onPointerDownCapture={blockPopups}
      onKeyDownCapture={(event) => (event.key === "Enter" || event.key === " ") && blockPopups(event)}
    >
      {children}
    </div>
  );
}

const SIMPLE_ICONS = "https://cdn.simpleicons.org/";

const recolor = (image: HTMLImageElement) => {
  if (!image.src.startsWith(SIMPLE_ICONS) || image.dataset.brand) return;
  const [slug, tone] = image.src.slice(SIMPLE_ICONS.length).split("/");
  image.dataset.brand = slug;
  image.src = brandIcon(slug ?? "", tone === "eeeeee");
};

const watchIcons = (root: ShadowRoot) => {
  const sweep = () => {
    for (const image of root.querySelectorAll("img")) recolor(image);
  };
  new MutationObserver(sweep).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
};

interface IslandOptions {
  initial: string;
  render: () => ReactNode;
  width: number;
  height?: number;
  className?: string;
  client?: QueryClient;
}

export const mountIsland = (host: HTMLElement, { initial, render, width, height, className, client }: IslandOptions) => {
  const shadow = host.attachShadow({ mode: "open" });
  shadow.adoptedStyleSheets = [sheet];
  watchIcons(shadow);
  const canvas = document.createElement("div");
  canvas.className = "showcase-canvas";
  canvas.style.width = `${width}px`;
  if (height) {
    canvas.style.height = `${height}px`;
    canvas.style.setProperty("--canvas-h", `${height}px`);
  }
  shadow.append(canvas);
  new ResizeObserver(([entry]) => {
    if (!entry) return;
    const scale = entry.contentRect.width / width;
    host.style.setProperty("--s", String(scale));
    if (!height) canvas.style.minHeight = `${entry.contentRect.height / scale}px`;
  }).observe(host);
  const rootRoute = createRootRoute({ component: () => <Island className={className}>{render()}</Island> });
  const routeTree = rootRoute.addChildren([createRoute({ getParentRoute: () => rootRoute, path: "$" })]);
  const restoration = history.scrollRestoration;
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initial] }),
    scrollRestoration: () => false,
  });
  history.scrollRestoration = restoration;
  createRoot(canvas).render(
    <QueryClientProvider client={client ?? createDemoClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  requestAnimationFrame(() => host.setAttribute("data-ready", ""));
  return shadow;
};
