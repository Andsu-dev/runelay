import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";
import { AGENT_LOGO_MATCHERS } from "@/modules/activity/constants/agent-logos.constants";
import { ClientLogo } from "@/modules/setup/components/client-logo";

interface AgentChipProps {
  name: string;
  seed: string;
  muted?: boolean;
  hideName?: boolean;
}

export function AgentChip({ name, seed, muted = false, hideName = false }: AgentChipProps) {
  const logo = muted ? null : (AGENT_LOGO_MATCHERS.find(({ pattern }) => pattern.test(name))?.logo ?? null);

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 text-[12px] text-muted-foreground">
      {logo ? (
        <ClientLogo logo={logo} />
      ) : (
        <span
          aria-hidden
          className={cn("size-3.5 shrink-0 rounded-full", muted ? "bg-muted-foreground/30" : avatarGradient(seed))}
        />
      )}
      {!hideName && <span className="truncate">{name}</span>}
    </span>
  );
}
