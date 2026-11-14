import { Menu01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/brand/logo-mark";
import { IconAction } from "@/components/ui/action/icon-action";

interface MobileTopBarProps {
  onMenu: () => void;
  onSearch: () => void;
}

export function MobileTopBar({ onMenu, onSearch }: MobileTopBarProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 bg-sidebar/90 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md lg:hidden">
      <IconAction icon={Menu01Icon} label="Abrir menu" onClick={onMenu} />
      <Link to="/overview" className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
        <span className="flex size-7 items-center justify-center rounded-md bg-app-icon shadow-xs">
          <LogoMark className="size-4" />
        </span>
        runelay
      </Link>
      <div className="ml-auto">
        <IconAction icon={Search01Icon} label="Buscar" onClick={onSearch} />
      </div>
    </div>
  );
}
