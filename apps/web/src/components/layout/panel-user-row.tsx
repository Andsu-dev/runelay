import { Logout03Icon, MoreHorizontalIcon, VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AuthUser } from "@runeley/shared";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import { useSignOut } from "./use-sign-out";
import { UserAvatar } from "./user-avatar";

interface PanelUserRowProps {
  user: AuthUser;
}

export function PanelUserRow({ user }: PanelUserRowProps) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const soundOn = useSoundEnabled();

  return (
    <div className="flex items-center gap-2.5 px-2.5">
      <UserAvatar name={user.name} seed={user.id} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">{user.name}</span>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        side="top"
        align="end"
        className="w-44"
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Opções da conta">
            <HugeiconsIcon icon={MoreHorizontalIcon} size={17} strokeWidth={1.6} />
          </Button>
        }
      >
        <DropdownMenuItem icon={soundOn ? VolumeOffIcon : VolumeHighIcon} onSelect={() => setSoundEnabled(!soundOn)}>
          {soundOn ? "Desligar sons" : "Ligar sons"}
        </DropdownMenuItem>
        <DropdownMenuItem icon={Logout03Icon} onSelect={signOut}>
          Sair
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
}
