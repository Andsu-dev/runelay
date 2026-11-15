import { useQuery } from "@tanstack/react-query";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { ApiKeyList } from "@/modules/api-keys/components/api-key-list";
import { InstalledView } from "@/modules/catalog/components/installed-view";
import { MemoryHealthCard } from "@/modules/memory/components/memory-health-card";
import { MemoryList } from "@/modules/memory/components/memory-list";
import { SkillList } from "@/modules/skills/components/skill-list";

function Keys() {
  const { data: apiKeys = [] } = useQuery(apiKeysQuery);
  return <ApiKeyList apiKeys={apiKeys} />;
}

export const BENTO = {
  "skills-grid": { path: "/skills", width: 940, compact: 460, render: () => <SkillList query="" /> },
  "memory-list": { path: "/memory", width: 760, compact: 520, render: () => <MemoryList filter={{ query: "" }} /> },
  health: { path: "/memory", width: 420, render: () => <MemoryHealthCard /> },
  keys: { path: "/api-keys", width: 760, compact: 560, render: () => <Keys /> },
  connect: { path: "/connectors", width: 900, compact: 680, render: () => <InstalledView /> },
  skills: { path: "/skills", width: 460, render: () => <SkillList query="" /> },
  memory: {
    path: "/memory",
    width: 940,
    compact: 520,
    render: () => (
      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="order-2 min-w-0 md:order-1">
          <MemoryList filter={{ query: "" }} />
        </div>
        <div className="order-1 md:order-2">
          <MemoryHealthCard />
        </div>
      </div>
    ),
  },
};
