import { Delete02Icon, LinkSquare01Icon, MoreHorizontalIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CatalogConnectorView } from "@runelay/shared";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";
import { useT } from "@/lib/i18n";
import type { useCatalogActions } from "@/modules/catalog/hooks/use-catalog-actions";

interface InstalledConnectorMenuProps {
  connector: CatalogConnectorView;
  actions: ReturnType<typeof useCatalogActions>;
}

export function InstalledConnectorMenu({ connector, actions }: InstalledConnectorMenuProps) {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const keepFocusRef = useRef(false);

  return (
    <div className="shrink-0">
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        className="w-44"
        onCloseAutoFocus={(event) => {
          if (!keepFocusRef.current) return;
          keepFocusRef.current = false;
          event.preventDefault();
          setConfirming(true);
        }}
        trigger={
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon-sm"
            aria-label={t("catalog.options", { name: connector.name })}
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={17} strokeWidth={1.6} />
          </Button>
        }
      >
        <DropdownMenuItem
          icon={LinkSquare01Icon}
          onSelect={() => navigate({ to: "/connectors/$name", params: { name: actions.sourceName } })}
        >
          {t("catalog.open")}
        </DropdownMenuItem>
        {connector.auth === "oauth" && (
          <DropdownMenuItem icon={RefreshIcon} disabled={actions.reconnect.isPending} onSelect={actions.startReconnect}>
            {t("catalog.reconnect")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={Delete02Icon}
          destructive
          onSelect={() => {
            keepFocusRef.current = true;
            setOpen(false);
          }}
        >
          {t("catalog.remove")}
        </DropdownMenuItem>
      </DropdownMenu>
      <ConfirmPopover
        open={confirming}
        onOpenChange={setConfirming}
        anchorRef={menuButtonRef}
        title={t("catalog.removeTitle", { name: connector.name })}
        description={t("catalog.removeDescription")}
        confirmLabel={t("catalog.remove")}
        onConfirm={() => actions.remove.mutate()}
      />
    </div>
  );
}
