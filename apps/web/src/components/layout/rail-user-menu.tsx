import { Logout03Icon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import type { AuthUser } from "@runelay/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import { versionQuery } from "@/modules/system/api/system.api";
import { useSignOut } from "./use-sign-out";
import { UserAvatar } from "./user-avatar";

interface RailUserMenuProps {
  user: AuthUser;
}

export function RailUserMenu({ user }: RailUserMenuProps) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const soundOn = useSoundEnabled();
  const { data: version } = useQuery(versionQuery);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      side="right"
      align="end"
      className="w-56"
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Conta de ${user.name}`}>
          <UserAvatar name={user.name} seed={user.id} />
        </Button>
      }
    >
      <div className="flex flex-col px-2.5 py-1.5">
        <span className="truncate text-[13px] font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={soundOn ? VolumeOffIcon : VolumeHighIcon} onSelect={() => setSoundEnabled(!soundOn)}>
        {soundOn ? "Desligar sons" : "Ligar sons"}
      </DropdownMenuItem>
      <DropdownMenuItem icon={Logout03Icon} onSelect={signOut}>
        Sair
      </DropdownMenuItem>
      {version && (
        <span className="block px-2.5 pt-1.5 pb-1 text-[11px] text-muted-foreground tabular-nums">
          runelay v{version.current}
        </span>
      )}
    </DropdownMenu>
  );
}
