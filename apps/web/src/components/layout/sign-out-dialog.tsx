import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";
import { useSignOut } from "./use-sign-out";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const t = useT();
  const signOut = useSignOut();
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    await signOut().finally(() => setPending(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={t("layout.account.signOutTitle")}
      description={t("layout.account.signOutDescription")}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="glass" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button variant="destructive" loading={pending} onClick={confirm}>
            {t("layout.account.signOut")}
          </Button>
        </div>
      }
    >
      <span className="sr-only">{t("layout.account.signOutConfirmation")}</span>
    </Dialog>
  );
}
