import { memoryHealthQuery } from "@/modules/memory/api/memories.api";
import { HEALTH_DAYS } from "@/modules/memory/constants/memory.constants";
import { BENTO } from "./bento";
import { DEMO_HEALTH } from "./demo-data";
import { HeroWindow } from "./hero";
import { createDemoClient, mountIsland } from "./island";
import { watchLive } from "./live";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clickFirstOff = (root: ShadowRoot, delay: number) =>
  setTimeout(() => root.querySelector<HTMLElement>('[role="switch"][aria-checked="false"]')?.click(), delay);

const countUp = (client: ReturnType<typeof createDemoClient>) => {
  const key = memoryHealthQuery(HEALTH_DAYS).queryKey;
  const empty = { ...DEMO_HEALTH, stale: [], brokenLinks: [], isolated: [] };
  client.setQueryData(key, empty);
  if (reduced) return client.setQueryData(key, DEMO_HEALTH);
  const steps = Math.max(DEMO_HEALTH.stale.length, DEMO_HEALTH.brokenLinks.length, DEMO_HEALTH.isolated.length);
  for (let step = 1; step <= steps; step++) {
    setTimeout(
      () =>
        client.setQueryData(key, {
          ...DEMO_HEALTH,
          stale: DEMO_HEALTH.stale.slice(0, step),
          brokenLinks: DEMO_HEALTH.brokenLinks.slice(0, step),
          isolated: DEMO_HEALTH.isolated.slice(0, step),
        }),
      400 + step * 220,
    );
  }
};

export const mount = (host: HTMLElement) => {
  if (host.shadowRoot) return;
  const kind = host.dataset.showcase ?? "";
  if (kind === "hero") {
    watchLive(host);
    const initial = host.dataset.route ?? "/overview";
    return void mountIsland(host, { initial, render: () => <HeroWindow />, width: 1440, height: 900 });
  }
  const card = BENTO[kind as keyof typeof BENTO];
  if (!card) return;
  const client = createDemoClient();
  if (kind === "memory" || kind === "health") countUp(client);
  const width = host.clientWidth < 520 && "compact" in card ? card.compact : card.width;
  const root = mountIsland(host, { initial: card.path, render: card.render, width, className: "bento-island", client });
  host.setAttribute("data-play", "");
  if (!reduced && (kind === "connect" || kind === "skills" || kind === "skills-grid")) clickFirstOff(root, 1100);
};
