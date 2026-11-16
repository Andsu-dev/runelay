import { useStartupLoop } from "@/modules/settings/hooks/use-startup-loop";

interface StartupLinkProps {
  d: string;
  frames: Keyframe[];
  reduce: boolean;
}

export function StartupLink({ d, frames, reduce }: StartupLinkProps) {
  const loop = useStartupLoop(frames, reduce);

  return (
    <path
      ref={loop}
      d={d}
      pathLength={1}
      strokeDasharray="1 1"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="stroke-success"
    />
  );
}
