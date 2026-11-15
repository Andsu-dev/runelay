import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { useT } from "@/lib/i18n";

export function RailLogo() {
  const t = useT();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to="/overview"
      aria-label={t("layout.shell.logoLabel")}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="flex size-10 items-center justify-center"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-app-icon shadow-xs">
        <LogoMark className="size-4.5" split={hovered} entrance />
      </span>
    </Link>
  );
}
