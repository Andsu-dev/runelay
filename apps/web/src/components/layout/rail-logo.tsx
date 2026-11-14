import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";

export function RailLogo() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to="/overview"
      aria-label="runelay, visão geral"
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
