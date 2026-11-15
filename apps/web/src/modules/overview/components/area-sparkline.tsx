import { motion } from "motion/react";
import { useId } from "react";

interface AreaSparklineProps {
  values: number[];
  color: string;
  label: string;
}

const WIDTH = 100;
const HEIGHT = 40;
const INSET = 2;

const toPoints = (values: number[]) => {
  const peak = Math.max(1, ...values);
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: index * step,
    y: HEIGHT - INSET - (value / peak) * (HEIGHT - INSET * 2),
  }));
};

const smoothPath = (points: { x: number; y: number }[]) =>
  points.reduce((path, point, index) => {
    const previous = points[index - 1];
    if (!previous) return `M ${point.x} ${point.y}`;
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y} ${middle} ${point.y} ${point.x} ${point.y}`;
  }, "");

export function AreaSparkline({ values, color, label }: AreaSparklineProps) {
  const gradientId = useId();
  const line = smoothPath(toPoints(values.length > 1 ? values : [0, ...values, 0]));
  const area = `${line} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="h-16 w-full overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
    </svg>
  );
}
