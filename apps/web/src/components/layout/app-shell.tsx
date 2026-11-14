import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { Sheet } from "@/components/ui/overlay/sheet";
import { readStorage, writeStorage } from "@/lib/storage";
import { meQuery } from "@/modules/auth/api/session.api";
import { CommandDialog } from "@/modules/search/components/command-dialog";
import { SetupCelebrationDialog } from "@/modules/setup/components/setup-celebration-dialog";
import { IconRail } from "./icon-rail";
import { MobileTopBar } from "./mobile-top-bar";
import { RouteTransition } from "./route-transition";
import { SidePanel } from "./side-panel";

const PANEL_WIDTH = 248;
const COLLAPSED_KEY = "runeley-panel-collapsed";

export function AppShell() {
  const { data: me } = useSuspenseQuery(meQuery);
  const [collapsed, setCollapsed] = useState(() => readStorage(COLLAPSED_KEY) === "true");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const changeCollapsed = (next: boolean) => {
    setCollapsed(next);
    writeStorage(COLLAPSED_KEY, next ? "true" : null);
  };

  const listenShortcut = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const open = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setSearching(true);
    };
    window.addEventListener("keydown", open);
    return () => window.removeEventListener("keydown", open);
  }, []);

  return (
    <div ref={listenShortcut} className="flex min-h-dvh flex-col bg-panel lg:flex-row">
      <IconRail
        user={me.user}
        collapsed={collapsed}
        onExpand={() => changeCollapsed(false)}
        onSearch={() => setSearching(true)}
      />

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 0 : PANEL_WIDTH, opacity: collapsed ? 0 : 1 }}
        transition={UI_SPRING}
        aria-hidden={collapsed || undefined}
        inert={collapsed || undefined}
        className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden lg:block"
      >
        <div style={{ width: PANEL_WIDTH }} className="h-full">
          <SidePanel scope="desktop" onCollapse={() => changeCollapsed(true)} />
        </div>
      </motion.aside>

      <MobileTopBar onMenu={() => setDrawerOpen(true)} onSearch={() => setSearching(true)} />

      <main className="min-w-0 flex-1 bg-background shadow-sm max-lg:rounded-t-xl lg:my-2 lg:mr-2 lg:rounded-xl">
        <RouteTransition />
      </main>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} title="Menu" side="left" hideHeader>
        <SidePanel scope="drawer" onNavigate={() => setDrawerOpen(false)} />
      </Sheet>

      <CommandDialog open={searching} onOpenChange={setSearching} />
      <SetupCelebrationDialog key={me.organization.id} organizationId={me.organization.id} />
    </div>
  );
}
