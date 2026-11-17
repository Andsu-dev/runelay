import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { openContribute } from "@/components/layout/use-contribute";
import { Button } from "@/components/ui/action/button";
import { PixelConfetti } from "@/components/ui/display/pixel-confetti";
import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";
import { cue } from "@/lib/sound";
import { readStorage, writeStorage } from "@/lib/storage";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";
import { SetupDone } from "./setup-done";

interface SetupCelebrationDialogProps {
  organizationId: string;
}

const playCelebration = (node: HTMLDivElement | null) => {
  if (node) cue("success");
};

export function SetupCelebrationDialog({ organizationId }: SetupCelebrationDialogProps) {
  const t = useT();
  const storageKey = `runelay-setup-celebrated:${organizationId}`;
  const { finished, loaded, agentNames } = useSetupProgress(organizationId);
  const [celebrated, setCelebrated] = useState(() => readStorage(storageKey) === "true");
  const open = loaded && finished && !celebrated;

  const close = (next: boolean) => {
    if (next) return;
    setCelebrated(true);
    writeStorage(storageKey, "true");
  };

  return (
    <div>
      {open && (
        <div ref={playCelebration}>
          <PixelConfetti />
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={close}
        title={t("setup.celebration.dialogTitle")}
        hideHeader
        contentClassName="sm:max-w-sm"
      >
        <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
          <span className="flex items-center">
            <span className="relative z-10 flex size-14 items-center justify-center rounded-xl bg-app-icon shadow-lg">
              <LogoMark className="size-8" entrance />
            </span>
            <span aria-hidden className="-ml-3 text-[44px] leading-none">
              ☕
            </span>
          </span>
          <SetupDone agents={agentNames} centered onNavigate={() => close(false)}>
            <Button variant="ghost" className="cursor-pointer" onClick={openContribute}>
              {t("setup.celebration.supportAction")}
            </Button>
          </SetupDone>
        </div>
      </Dialog>
    </div>
  );
}
