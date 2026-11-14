import { Delete02Icon, LinkSquare01Icon, MoreHorizontalIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CatalogConnectorView } from "@runeley/shared";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";
import type { useCatalogActions } from "@/modules/catalog/hooks/use-catalog-actions";
import { DeleteSourceDialog } from "@/modules/sources/components/delete-source-dialog";

interface InstalledConnectorMenuProps {
  connector: CatalogConnectorView;
  actions: ReturnType<typeof useCatalogActions>;
}

export function InstalledConnectorMenu({ connector, actions }: InstalledConnectorMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="shrink-0">
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        className="w-44"
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Opções de ${connector.name}`}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={17} strokeWidth={1.6} />
          </Button>
        }
      >
        <DropdownMenuItem
          icon={LinkSquare01Icon}
          onSelect={() => navigate({ to: "/connectors/$name", params: { name: actions.sourceName } })}
        >
          Abrir
        </DropdownMenuItem>
        {connector.auth === "oauth" && (
          <DropdownMenuItem icon={RefreshIcon} disabled={actions.reconnect.isPending} onSelect={actions.startReconnect}>
            Reconectar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={Delete02Icon} destructive onSelect={() => setConfirming(true)}>
          Remover
        </DropdownMenuItem>
      </DropdownMenu>
      <DeleteSourceDialog
        name={connector.name}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => actions.remove.mutate()}
      />
    </div>
  );
}
