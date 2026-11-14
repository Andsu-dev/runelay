import { useState } from "react";
import { FollowAuthorLink } from "@/components/brand/follow-author-link";
import { LogoMark } from "@/components/brand/logo-mark";
import { PixelConfetti } from "@/components/ui/display/pixel-confetti";
import { Dialog } from "@/components/ui/overlay/dialog";
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
  const storageKey = `runeley-setup-celebrated:${organizationId}`;
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
      <Dialog open={open} onOpenChange={close} title="Setup concluído" hideHeader contentClassName="sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl bg-app-icon shadow-lg">
            <LogoMark className="size-8" entrance />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">Parabéns, você completou o setup!</h2>
            <p className="text-[13px] text-pretty text-muted-foreground">
              Seus agentes agora usam as mesmas contas, as mesmas habilidades e a mesma memória. O que um aprende, todos
              sabem.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FollowAuthorLink />
            <span className="text-xs text-muted-foreground">Novidades do runeley saem primeiro por lá.</span>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
