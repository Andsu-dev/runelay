import { Add01Icon, ArrowDown01Icon, FileImportIcon, PlugSocketIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { AddSourceDialog } from "@/modules/sources/components/add-source-dialog";
import { ImportDialog } from "@/modules/sources/components/import-dialog";

export function AddConnectorMenu() {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <div>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        className="w-60"
        trigger={
          <Button size="sm">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={1.8} />
            Adicionar
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.8} className="-mr-1 opacity-70" />
          </Button>
        }
      >
        <DropdownMenuItem icon={PlugSocketIcon} onSelect={() => setAdding(true)}>
          Conexão personalizada
        </DropdownMenuItem>
        <DropdownMenuItem icon={FileImportIcon} onSelect={() => setImporting(true)}>
          Importar de outro cliente
        </DropdownMenuItem>
      </DropdownMenu>
      <AddSourceDialog open={adding} onOpenChange={setAdding} />
      <ImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  );
}
