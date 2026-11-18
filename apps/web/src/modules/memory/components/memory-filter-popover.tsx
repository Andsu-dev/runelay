import {
  Brain02Icon,
  FilterHorizontalIcon,
  Folder01Icon,
  Link01Icon,
  Message01Icon,
  PinIcon,
  Tick02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Switch } from "@/components/ui/form/switch";
import { Popover } from "@/components/ui/overlay/popover";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MEMORY_TYPE_OPTIONS, type MemoryFilter } from "@/modules/memory/constants/memory.constants";

type TypeFilter = Exclude<MemoryFilter, "pinned">;

const TYPE_ICONS = {
  all: Brain02Icon,
  user: UserIcon,
  feedback: Message01Icon,
  project: Folder01Icon,
  reference: Link01Icon,
} satisfies Record<TypeFilter, typeof Brain02Icon>;

interface MemoryFilterPopoverProps {
  type: TypeFilter;
  pinned: boolean;
  onChange: (type: TypeFilter, pinned: boolean) => void;
}

export function MemoryFilterPopover({ type, pinned, onChange }: MemoryFilterPopoverProps) {
  const t = useT();
  const pinnedId = useId();
  const [open, setOpen] = useState(false);
  const active = type !== "all" || pinned;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      className="w-52"
      trigger={
        <Button
          size="icon"
          variant={active ? "glass" : "ghost"}
          className={cn("relative size-11 sm:size-9", active && "text-primary")}
          aria-label={t(active ? "memory.filters.active" : "memory.filters.label")}
          title={t("memory.filters.label")}
        >
          <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={1.6} aria-hidden />
          {active && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-current" aria-hidden />}
        </Button>
      }
    >
      <fieldset className="flex flex-col gap-0.5">
        <legend className="sr-only">{t("memory.fields.type")}</legend>
        {[{ value: "all", label: "memory.filters.all" } as const, ...MEMORY_TYPE_OPTIONS].map(({ value, label }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            className="min-h-10 justify-start sm:min-h-8"
            aria-pressed={type === value}
            onClick={() => onChange(value, pinned)}
          >
            <HugeiconsIcon icon={TYPE_ICONS[value]} strokeWidth={1.6} aria-hidden />
            <span className="flex-1 text-left">{t(label)}</span>
            {type === value && <HugeiconsIcon icon={Tick02Icon} strokeWidth={1.6} aria-hidden />}
          </Button>
        ))}
      </fieldset>
      <div className="mt-1 flex min-h-10 items-center justify-between gap-3 px-2.5">
        <label htmlFor={pinnedId} className="flex items-center gap-1.5 text-[13px] font-medium">
          <HugeiconsIcon icon={PinIcon} size={16} strokeWidth={1.6} className="text-muted-foreground" aria-hidden />
          {t("memory.filters.pinned")}
        </label>
        <Switch
          id={pinnedId}
          checked={pinned}
          onCheckedChange={(checked) => onChange(type, checked)}
          label={t("memory.filters.pinned")}
        />
      </div>
    </Popover>
  );
}
