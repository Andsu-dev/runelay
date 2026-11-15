import { cn } from "@/lib/utils";

interface FlagUsProps {
  className?: string;
}

const STRIPE_HEIGHT = 12 / 13;
const RED_STRIPES = [0, 2, 4, 6, 8, 10, 12];
const STARS = [
  [1, 0.9],
  [2.6, 0.9],
  [4.2, 0.9],
  [1.8, 2.1],
  [3.4, 2.1],
  [1, 3.3],
  [2.6, 3.3],
  [4.2, 3.3],
  [1.8, 4.5],
  [3.4, 4.5],
] as const;

export function FlagUs({ className }: FlagUsProps) {
  return (
    <svg
      viewBox="0 0 16 12"
      width={16}
      height={12}
      aria-hidden
      className={cn("shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]", className)}
    >
      <rect width="16" height="12" fill="#fff" />
      {RED_STRIPES.map((index) => (
        <rect key={index} y={index * STRIPE_HEIGHT} width="16" height={STRIPE_HEIGHT} fill="#B22234" />
      ))}
      <rect width="6.4" height={STRIPE_HEIGHT * 7} fill="#3C3B6E" />
      {STARS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.32" fill="#fff" />
      ))}
    </svg>
  );
}
