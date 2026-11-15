import { type ReactNode, type RefObject, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Popover } from "@/components/ui/overlay/popover";
import { useT } from "@/lib/i18n";

interface ConfirmPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  anchorRef?: RefObject<HTMLElement | null>;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => unknown;
  pending?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function ConfirmPopover({
  open,
  onOpenChange,
  trigger,
  anchorRef,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
  align = "end",
  side = "bottom",
}: ConfirmPopoverProps) {
  const t = useT();
  const [settling, setSettling] = useState(false);
  const busy = pending || settling;

  const confirm = () => {
    const result = onConfirm();
    if (!(result instanceof Promise)) {
      onOpenChange(false);
      return;
    }
    setSettling(true);
    result.then(
      () => {
        setSettling(false);
        onOpenChange(false);
      },
      () => setSettling(false),
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
      trigger={trigger}
      anchorRef={anchorRef}
      align={align}
      side={side}
      className="w-64 p-3"
    >
      <div role="alertdialog" aria-label={title} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-pretty text-muted-foreground">{description}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" autoFocus disabled={busy} onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button variant="destructive" size="sm" loading={busy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Popover>
  );
}
