import { useState } from "react";
import { MonogramTile } from "@/components/ui/display/monogram-tile";
import { cn } from "@/lib/utils";
import { SIMPLE_ICONS_URL } from "@/modules/catalog/constants/catalog.constants";

interface ConnectorIconProps {
  name: string;
  icon: string | null;
  size?: "sm" | "md";
}

const SIZES = {
  sm: { tile: "size-5 rounded-[5px]", image: "size-3", monogram: "size-5 rounded-[5px] text-[10px]" },
  md: { tile: "size-9 rounded-lg", image: "size-[18px]", monogram: "size-9" },
};

export function ConnectorIcon({ name, icon, size = "md" }: ConnectorIconProps) {
  const [failed, setFailed] = useState(false);
  const sizes = SIZES[size];

  if (!icon || failed) return <MonogramTile label={name} className={sizes.monogram} />;

  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center bg-muted", sizes.tile)}>
      <img
        src={`${SIMPLE_ICONS_URL}/${icon}/111111`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("dark:hidden", sizes.image)}
      />
      <img
        src={`${SIMPLE_ICONS_URL}/${icon}/eeeeee`}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("hidden dark:block", sizes.image)}
      />
    </span>
  );
}
