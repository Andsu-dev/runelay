import { Search01Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import type { AuthUser } from "@runelay/shared";
import { AnimatePresence, motion } from "motion/react";
import { NAV_CATEGORIES } from "./nav-items";
import { RailButton } from "./rail-button";
import { RailLink } from "./rail-link";
import { RailLogo } from "./rail-logo";
import { RailUserMenu } from "./rail-user-menu";
import { ThemeToggle } from "./theme-toggle";
import { UpdateButton } from "./update-button";
import { useActiveCategory } from "./use-active-category";

interface IconRailProps {
  user: AuthUser;
  collapsed: boolean;
  onExpand: () => void;
  onSearch: () => void;
}

export function IconRail({ user, collapsed, onExpand, onSearch }: IconRailProps) {
  const activeCategory = useActiveCategory();

  return (
    <nav
      aria-label="Categorias"
      className="sticky top-0 hidden h-dvh w-14 shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-rail py-3 lg:flex"
    >
      <RailLogo />
      <div className="mt-3 flex flex-col items-center gap-1.5">
        <RailButton icon={Search01Icon} label="Buscar (⌘K)" onClick={onSearch} />
        <span aria-hidden className="my-1.5 h-px w-5 bg-border/70" />
        {NAV_CATEGORIES.map((category) => (
          <RailLink key={category.id} category={category} active={category.id === activeCategory.id} />
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-1.5">
        <AnimatePresence initial={false}>
          {collapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            >
              <RailButton icon={SidebarLeftIcon} label="Abrir painel" onClick={onExpand} />
            </motion.div>
          )}
        </AnimatePresence>
        <UpdateButton />
        <ThemeToggle />
        <RailUserMenu user={user} />
      </div>
    </nav>
  );
}
