import { useCallback } from "react";
import { STARTUP_LOOP_MS } from "@/modules/settings/constants/settings.constants";

export const useStartupLoop = (frames: Keyframe[], reduce: boolean) =>
  useCallback(
    (node: Element | null) => {
      if (!node || reduce) return;
      const animation = node.animate(frames, { duration: STARTUP_LOOP_MS, iterations: Number.POSITIVE_INFINITY });
      animation.startTime = 0;
      return () => animation.cancel();
    },
    [frames, reduce],
  );
