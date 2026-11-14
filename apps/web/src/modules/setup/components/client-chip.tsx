import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";
import { ClientLogo } from "./client-logo";

interface ClientChipProps {
  client: string;
  logo: { light: string; dark: string; scale?: number } | null;
  order: number;
  selected: boolean;
  onSelect: () => void;
}

export function ClientChip({ client, logo, order, selected, onSelect }: ClientChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: TIMELINE_EASE, delay: 0.25 + order * 0.07 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-medium whitespace-nowrap",
        selected ? "button-solid" : "button-glass",
      )}
    >
      <ClientLogo logo={logo} inverted={selected} />
      {client}
    </motion.button>
  );
}
