import { HugeiconsIcon } from "@hugeicons/react";
import type { SourceKind } from "@runelay/shared";
import { motion } from "motion/react";
import { McpIcon } from "@/components/brand/mcp-icon";
import { UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";
import { KIND_ICON, KIND_LABEL } from "@/modules/sources/constants/source.constants";

const KINDS: SourceKind[] = ["mcp", "stdio", "openapi"];

interface KindSwitchProps {
  value: SourceKind;
  onChange: (kind: SourceKind) => void;
}

export function KindSwitch({ value, onChange }: KindSwitchProps) {
  return (
    <fieldset className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg bg-muted/60 p-1">
      <legend className="sr-only">Tipo de conexão</legend>
      {KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          aria-pressed={value === kind}
          onClick={() => onChange(kind)}
          className={cn(
            "relative flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset",
            value === kind ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === kind && (
            <motion.span
              layoutId="kind-switch"
              layoutDependency={value}
              transition={UI_SPRING}
              className="absolute inset-0 rounded-md bg-card shadow-xs"
            />
          )}
          {kind === "mcp" ? (
            <McpIcon size={15} className="relative" />
          ) : (
            <HugeiconsIcon icon={KIND_ICON[kind]} size={16} strokeWidth={1.6} className="relative shrink-0" />
          )}
          <span className="relative truncate">{KIND_LABEL[kind]}</span>
        </button>
      ))}
    </fieldset>
  );
}
