import { useReducedMotion } from "motion/react";
import { useT } from "@/lib/i18n";
import { STARTUP_AGENTS } from "@/modules/settings/constants/settings.constants";
import { StartupAgentNode } from "./startup-agent-node";
import { StartupLinks } from "./startup-links";
import { StartupScreen } from "./startup-screen";
import { StartupStatusBadge } from "./startup-status-badge";

interface StartupIllustrationProps {
  on: boolean;
}

export function StartupIllustration({ on }: StartupIllustrationProps) {
  const t = useT();
  const reduce = Boolean(useReducedMotion());

  return (
    <div
      role="img"
      aria-label={t(on ? "settings.startup.sceneOn" : "settings.startup.sceneOff")}
      className="flex flex-col items-center justify-center gap-2.5 rounded-lg bg-muted/60 px-4 pt-4 pb-3 dark:bg-muted/30"
    >
      <div className="flex items-center">
        <StartupScreen on={on} reduce={reduce} />
        <StartupLinks on={on} reduce={reduce} />
        <div className="flex flex-col gap-3">
          {STARTUP_AGENTS.map((agent) => (
            <StartupAgentNode key={agent.id} icon={agent.icon} frames={agent.frames} on={on} reduce={reduce} />
          ))}
        </div>
      </div>
      <div className="relative h-5 w-full">
        <StartupStatusBadge visible={!on} online={false} label={t("settings.startup.offline")} reduce={reduce} />
        <StartupStatusBadge visible={on} online label={t("settings.startup.online")} reduce={reduce} />
      </div>
    </div>
  );
}
