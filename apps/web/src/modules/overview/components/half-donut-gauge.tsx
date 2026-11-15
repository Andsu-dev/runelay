import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { ChartTooltip } from "./chart-tooltip";

interface HalfDonutGaugeProps {
  segments: { key: string; share: number; color: string; tooltip: ReactNode }[];
  label: string;
  children: ReactNode;
}

const ARC = "M 20 100 A 80 80 0 0 1 180 100";
const GAP = 0.008;
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 108;
const RADIUS = 80;
const STROKE = 16;

const pointOnArc = (fraction: number) => {
  const angle = Math.PI * (1 - fraction);
  const x = 100 + RADIUS * Math.cos(angle);
  const y = 100 - (RADIUS + STROKE / 2) * Math.sin(angle);
  return { x: x / VIEW_WIDTH, y: (VIEW_HEIGHT - y) / VIEW_HEIGHT };
};

export function HalfDonutGauge({ segments, label, children }: HalfDonutGaugeProps) {
  const placed = segments.reduce<
    { key: string; color: string; tooltip: ReactNode; start: number; length: number }[]
  >((list, segment) => {
    const previous = list.at(-1);
    const start = previous ? previous.start + previous.length + GAP : 0;
    return [...list, { ...segment, start, length: Math.max(segment.share - GAP, 0) }];
  }, []);
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const shownSegment = placed[shown];

  const activate = (index: number | null) => {
    setActive(index);
    if (index !== null) setShown(index);
  };

  return (
    <div className="relative mx-auto w-full max-w-64">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={label}
        className="w-full overflow-visible"
        onPointerLeave={() => activate(null)}
      >
        <path
          d={ARC}
          pathLength={1}
          fill="none"
          strokeWidth={STROKE}
          stroke="color-mix(in oklch, var(--foreground) 6%, transparent)"
        />
        {placed.map((segment, index) => (
          <motion.path
            key={segment.key}
            d={ARC}
            pathLength={1}
            fill="none"
            strokeWidth={STROKE}
            stroke={segment.color}
            strokeDashoffset={-segment.start}
            onPointerEnter={() => activate(index)}
            className="transition-opacity duration-150"
            opacity={active !== null && active !== index ? 0.4 : 1}
            initial={{ strokeDasharray: "0 1" }}
            animate={{ strokeDasharray: `${segment.length} 1` }}
            transition={{ duration: 0.8, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">{children}</div>
      <ChartTooltip
        anchor={active === null || !shownSegment ? null : pointOnArc(shownSegment.start + shownSegment.length / 2)}
      >
        {shownSegment?.tooltip}
      </ChartTooltip>
    </div>
  );
}
