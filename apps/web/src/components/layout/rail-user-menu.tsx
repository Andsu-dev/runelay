import { Logout03Icon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import type { AuthUser } from "@runelay/shared";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import { useSignOut } from "./use-sign-out";
import { UserAvatar } from "./user-avatar";

interface RailUserMenuProps {
  user: AuthUser;
}

export function RailUserMenu({ user }: RailUserMenuProps) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const soundOn = useSoundEnabled();

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
    </DropdownMenu>
  );
}
