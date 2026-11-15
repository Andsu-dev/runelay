import type { DailyCallsView } from "@runelay/shared";
import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface StackedDayBarProps {
  day: DailyCallsView;
  peak: number;
  index: number;
  dimmed: boolean;
  onActivate: (index: number | null) => void;
}

export function StackedDayBar({ day, peak, index, dimmed, onActivate }: StackedDayBarProps) {
  const t = useT();
  const connectors = day.calls - day.context;
  const height = peak > 0 ? (day.calls / peak) * 100 : 0;
  const label = t("overview.daily.barLabel", {
    day: formatDay(day.day),
    connectors,
    context: day.context,
    errors: day.errors,
  });

  return (
    <button
      type="button"
      aria-label={label}
      onPointerEnter={() => onActivate(index)}
      onFocus={() => onActivate(index)}
      onBlur={() => onActivate(null)}
      className={cn(
        "flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-sm outline-none transition-opacity duration-150 focus-visible:bg-foreground/5",
        dimmed && "opacity-40",
      )}
    >
      {day.calls > 0 ? (
        <motion.span
          initial={{ height: "0%" }}
          animate={{ height: `${height}%` }}
          transition={{ ...UI_SPRING, delay: index * 0.015 }}
          className="flex min-h-[4px] w-full max-w-6 flex-col gap-[2px]"
        >
          {day.context > 0 && (
            <span
              className="min-h-[2px] basis-0 rounded-[3px] last:rounded-b-none bg-linear-to-b from-chart-2 to-chart-2/60"
              style={{ flexGrow: day.context }}
            />
          )}
          {connectors > 0 && (
            <span
              className="min-h-[2px] basis-0 rounded-[3px] last:rounded-b-none bg-linear-to-b from-chart-1 to-chart-1/60"
              style={{ flexGrow: connectors }}
            />
          )}
        </motion.span>
      ) : (
        <span className="h-0.5 w-full max-w-6 rounded-full bg-foreground/10" />
      )}
    </button>
  );
}
