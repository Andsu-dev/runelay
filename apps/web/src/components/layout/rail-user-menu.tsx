import { Logout03Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import type { AuthUser } from "@runelay/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";
import { useT } from "@/lib/i18n";
import { versionQuery } from "@/modules/system/api/system.api";
import { SignOutDialog } from "./sign-out-dialog";
import { openContribute, useContributeSeen } from "./use-contribute";
import { UserAvatar } from "./user-avatar";

interface RailUserMenuProps {
  user: AuthUser;
}

export function RailUserMenu({ user }: RailUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const t = useT();
  const contributeSeen = useContributeSeen();
  const navigate = useNavigate();
  const { data: version } = useQuery(versionQuery);

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
        side="right"
        align="end"
        className="w-56"
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={t("layout.account.accountOf", { name: user.name })}
          >
            <UserAvatar name={user.name} seed={user.id} image={user.image} />
            {!contributeSeen && (
              <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-chart-1 ring-2 ring-rail" />
            )}
          </Button>
        }
      >
        <div className="flex flex-col px-2.5 py-1.5">
          <span className="truncate text-[13px] font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={Settings01Icon} onSelect={() => navigate({ to: "/settings/server" })}>
          {t("common.actions.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openContribute}>
          <span aria-hidden className="w-[15px] text-center text-[15px] leading-none">
            ☕
          </span>
          {t("layout.account.contribute")}
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
        {version && (
          <span className="block px-2.5 pt-1.5 pb-1 text-[11px] text-muted-foreground tabular-nums">
            runelay v{version.current}
          </span>
        )}
      </DropdownMenu>
      <SignOutDialog open={confirmingSignOut} onOpenChange={setConfirmingSignOut} />
    </>
  );
}
