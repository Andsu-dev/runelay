import { Logout03Icon, MoreHorizontalIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AuthUser } from "@runelay/shared";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { useT } from "@/lib/i18n";
import { SignOutDialog } from "./sign-out-dialog";
import { UserAvatar } from "./user-avatar";

interface PanelUserRowProps {
  user: AuthUser;
}

export function PanelUserRow({ user }: PanelUserRowProps) {
  const [open, setOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2.5 px-2.5">
      <UserAvatar name={user.name} seed={user.id} image={user.image} />
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">{user.name}</span>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        side="top"
        align="end"
        className="w-44"
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={t("layout.account.options")}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={17} strokeWidth={1.6} />
          </Button>
        }
      >
        <DropdownMenuItem icon={Settings01Icon} onSelect={() => navigate({ to: "/settings/server" })}>
          {t("common.actions.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={Logout03Icon}
          onSelect={() => {
            setOpen(false);
            setConfirmingSignOut(true);
          }}
        >
          {t("layout.account.signOut")}
        </DropdownMenuItem>
      </DropdownMenu>
      <SignOutDialog open={confirmingSignOut} onOpenChange={setConfirmingSignOut} />
    </div>
  );
}
