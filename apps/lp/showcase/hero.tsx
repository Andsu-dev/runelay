import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { IconRail } from "@/components/layout/icon-rail";
import { SidePanel } from "@/components/layout/side-panel";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { ApiKeyList } from "@/modules/api-keys/components/api-key-list";
import { InstalledView } from "@/modules/catalog/components/installed-view";
import { CONNECTOR_TITLE } from "@/modules/catalog/constants/catalog.constants";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { meQuery } from "@/modules/auth/api/session.api";
import type { MemoryListFilter } from "@/modules/memory/api/memories.api";
import { MemoryHealthCard } from "@/modules/memory/components/memory-health-card";
import { MemoryList } from "@/modules/memory/components/memory-list";
import { MemoryTotal } from "@/modules/memory/components/memory-total";
import { MEMORY_FILTER_TITLE, MEMORY_FILTER_VALUES } from "@/modules/memory/constants/memory.constants";
import { OverviewWidgets } from "@/modules/overview/components/overview-widgets";
import { PREVIEW_ACTIVITY, PREVIEW_SOURCES } from "@/modules/overview/constants/overview-preview.constants";
import { SkillList } from "@/modules/skills/components/skill-list";
import { SkillsTotal } from "@/modules/skills/components/skills-total";
import { useLiveActivity } from "./live";

type MemoryFilter = (typeof MEMORY_FILTER_VALUES)[number];

const PANEL_WIDTH = 248;

function OverviewPage() {
  const t = useT();
  const activity = useLiveActivity();
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{t("overview.header.welcome", { name: "Alex" })}</h1>
        <p className="text-[13px] text-muted-foreground">
          {t("overview.header.range", { days: PREVIEW_ACTIVITY.days, organization: "Acme" })}
        </p>
      </header>
      <OverviewWidgets activity={activity} sources={PREVIEW_SOURCES} />
    </section>
  );
}

function ConnectorsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t(CONNECTOR_TITLE.installed)} description={t("catalog.description")} />
      <InstalledView />
    </section>
  );
}

function MemoryPage({ filter }: { filter: MemoryFilter }) {
  const t = useT();
  const listFilter: MemoryListFilter = {
    query: "",
    type: filter === "all" || filter === "pinned" ? undefined : filter,
    pinned: filter === "pinned" || undefined,
  };
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t(MEMORY_FILTER_TITLE[filter])} description={<MemoryTotal filter={listFilter} />} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          <MemoryList key={filter} filter={listFilter} />
        </div>
        <aside className="order-1 lg:sticky lg:top-8 lg:order-2">
          <MemoryHealthCard />
        </aside>
      </div>
    </section>
  );
}

function SkillsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("skills.page.title")} description={<SkillsTotal query="" />} />
      <SkillList query="" />
    </section>
  );
}

function ApiKeysPage() {
  const t = useT();
  const { data: apiKeys = [] } = useQuery(apiKeysQuery);
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("apiKeys.title")} description={t("apiKeys.description")} />
      <ApiKeyList apiKeys={apiKeys} />
    </section>
  );
}

function CurrentPage() {
  const { pathname, search } = useLocation();
  const filter = (search as { filter?: MemoryFilter }).filter;
  if (pathname.startsWith("/connectors")) return <ConnectorsPage />;
  if (pathname.startsWith("/memory")) return <MemoryPage filter={filter && MEMORY_FILTER_VALUES.includes(filter) ? filter : "all"} />;
  if (pathname.startsWith("/skills")) return <SkillsPage />;
  if (pathname.startsWith("/api-keys") || pathname.startsWith("/setup")) return <ApiKeysPage />;
  return <OverviewPage />;
}

export function HeroWindow() {
  const { pathname } = useLocation();
  const { data: me } = useQuery(meQuery);

  return (
    <div className="flex h-dvh flex-col bg-panel lg:flex-row">
      {me && <IconRail user={me.user} collapsed={false} onExpand={() => null} onSearch={() => null} />}
      <aside className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden lg:block" style={{ width: PANEL_WIDTH }}>
        <SidePanel scope="desktop" onCollapse={() => null} />
      </aside>
      <main className="min-w-0 flex-1 overflow-hidden bg-background shadow-sm max-lg:rounded-t-xl lg:my-2 lg:mr-2 lg:rounded-xl">
        <div key={pathname} className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <CurrentPage />
        </div>
      </main>
    </div>
  );
}
