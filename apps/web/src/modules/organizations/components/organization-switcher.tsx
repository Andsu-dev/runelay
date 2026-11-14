import { Add01Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MeView, OrganizationView } from "@runeley/shared";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Popover } from "@/components/ui/overlay/popover";
import { useSwitchOrganization } from "@/modules/organizations/hooks/use-switch-organization";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrganizationOption } from "./organization-option";
import { OrganizationTile } from "./organization-tile";

interface OrganizationSwitcherProps {
  me: MeView;
}

export function OrganizationSwitcher({ me }: OrganizationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const switchOrganization = useSwitchOrganization();
  const active = me.organization;

  const select = (organization: OrganizationView) => {
    setOpen(false);
    if (organization.id === active.id) return;
    switchOrganization.mutate(organization);
  };

  return (
    <div className="min-w-0 flex-1">
      <Popover
        open={open}
        onOpenChange={setOpen}
        className="w-60"
        trigger={
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={switchOrganization.isPending}
            className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-lg px-1.5 text-left transition-colors duration-200 hover:bg-sidebar-active disabled:opacity-70 lg:min-h-10"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={active.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className="flex min-w-0 flex-1 items-center gap-2.5"
              >
                <OrganizationTile name={active.name} seed={active.id} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{active.name}</span>
              </motion.span>
            </AnimatePresence>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              size={15}
              strokeWidth={1.6}
              className="shrink-0 text-muted-foreground"
            />
          </motion.button>
        }
      >
        <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          Organizações
        </p>
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {me.organizations.map((organization) => (
            <OrganizationOption
              key={organization.id}
              organization={organization}
              active={organization.id === active.id}
              onSelect={select}
            />
          ))}
        </div>
        <div className="-mx-1.5 my-1.5 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setCreating(true);
          }}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground sm:min-h-9"
        >
          <span className="flex size-6 items-center justify-center">
            <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={1.8} />
          </span>
          Nova organização
        </button>
      </Popover>
      <CreateOrganizationDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
