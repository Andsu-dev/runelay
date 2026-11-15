import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { XIcon } from "@/components/brand/x-icon";
import { openContribute } from "@/components/layout/use-contribute";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { PixelConfetti } from "@/components/ui/display/pixel-confetti";
import { Dialog } from "@/components/ui/overlay/dialog";
import { AUTHOR } from "@/constants/author.constants";
import { useT } from "@/lib/i18n";
import { cue } from "@/lib/sound";
import { readStorage, writeStorage } from "@/lib/storage";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";

interface SetupCelebrationDialogProps {
  organizationId: string;
}

const playCelebration = (node: HTMLDivElement | null) => {
  if (node) cue("success");
};

export function SetupCelebrationDialog({ organizationId }: SetupCelebrationDialogProps) {
  const t = useT();
  const storageKey = `runelay-setup-celebrated:${organizationId}`;
  const { finished, loaded } = useSetupProgress(organizationId);
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
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">{t("setup.celebration.title")}</h2>
            <p className="text-[13px] text-pretty text-muted-foreground">{t("setup.celebration.description")}</p>
          </div>
          <div className="flex w-full gap-2">
            <Button className="flex-1" onClick={openContribute}>
              {t("setup.celebration.supportAction")}
            </Button>
            <a
              href={AUTHOR.url}
              target="_blank"
              rel="noreferrer"
              data-sound="tap"
              className={buttonVariants({ variant: "glass" })}
            >
              <XIcon />
              {t("setup.celebration.follow")}
            </a>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
