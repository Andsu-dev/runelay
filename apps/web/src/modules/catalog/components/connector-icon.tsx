import { useState } from "react";
import { MonogramTile } from "@/components/ui/display/monogram-tile";
import { cn } from "@/lib/utils";
import { FULL_BLEED_ICONS, SIMPLE_ICONS_URL } from "@/modules/catalog/constants/catalog.constants";

interface ConnectorIconProps {
  name: string;
  icon: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { tile: "size-5 rounded-[5px]", image: "size-3", monogram: "size-5 rounded-[5px] text-[10px]" },
  md: { tile: "size-9 rounded-lg", image: "size-[18px]", monogram: "size-9" },
  lg: { tile: "size-12 rounded-xl", image: "size-7", monogram: "size-12 rounded-xl text-[16px]" },
};

export function ConnectorIcon({ name, icon, size = "md" }: ConnectorIconProps) {
  const [failed, setFailed] = useState(false);
  const sizes = SIZES[size];

  if (!icon || failed) return <MonogramTile label={name} className={sizes.monogram} />;

  if (FULL_BLEED_ICONS.has(icon))
    return (
      <img
        src={icon}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("shrink-0 object-cover", sizes.tile)}
      />
    );

  if (icon.startsWith("/"))
    return (
      <span aria-hidden className={cn("flex shrink-0 items-center justify-center bg-muted", sizes.tile)}>
        <span
          className={cn("bg-foreground", sizes.image)}
          style={{
            mask: `url(${icon}) center / contain no-repeat`,
            WebkitMask: `url(${icon}) center / contain no-repeat`,
          }}
        />
      </span>
    );

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
