import { useCallback, useRef } from "react";

interface LoadMoreSentinelProps {
  active: boolean;
  busy: boolean;
  onReach: () => void;
  rootMargin?: string;
}

export function LoadMoreSentinel({ active, busy, onReach, rootMargin = "240px" }: LoadMoreSentinelProps) {
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onReachRef.current();
        },
        { rootMargin },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [rootMargin],
  );

  if (!active && !busy) return null;

  return (
    <div ref={active ? attach : undefined} className="flex h-10 items-center justify-center">
      {busy && <p className="text-[12px] text-muted-foreground">Carregando</p>}
    </div>
  );
}
