import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { IconAction } from "@/components/ui/action/icon-action";
import { meQuery } from "@/modules/auth/api/session.api";
import { GettingStartedCard } from "@/modules/onboarding/components/getting-started-card";
import { OrganizationSwitcher } from "@/modules/organizations/components/organization-switcher";
import { NAV_CATEGORIES } from "./nav-items";
import { PanelCategory } from "./panel-category";
import { PanelUserRow } from "./panel-user-row";
import { useActiveCategory } from "./use-active-category";

interface SidePanelProps {
  scope: string;
  onCollapse?: () => void;
  onNavigate?: () => void;
}

export function SidePanel({ scope, onCollapse, onNavigate }: SidePanelProps) {
  const { data: me } = useSuspenseQuery(meQuery);
  const activeCategory = useActiveCategory();
  const categories = scope === "drawer" ? NAV_CATEGORIES : [activeCategory];

  return (
    <div className="flex h-full w-full flex-col gap-4 bg-panel px-2 py-3">
      <div className="flex items-center gap-1">
        <OrganizationSwitcher me={me} />
        {onCollapse && <IconAction icon={SidebarLeftIcon} label="Recolher painel" onClick={onCollapse} />}
      </div>

      <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${me.organization.id}:${categories.map((category) => category.id).join(",")}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col gap-5"
          >
            {categories.map((category) => (
              <PanelCategory key={category.id} category={category} scope={scope} onNavigate={onNavigate} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <GettingStartedCard key={me.organization.id} organizationId={me.organization.id} onNavigate={onNavigate} />
        {scope === "drawer" && <PanelUserRow user={me.user} />}
      </div>
    </div>
  );
}
