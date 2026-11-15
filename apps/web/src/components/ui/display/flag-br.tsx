import { cn } from "@/lib/utils";

interface FlagBrProps {
  className?: string;
}

export function FlagBr({ className }: FlagBrProps) {
  return (
    <svg
      viewBox="0 0 16 12"
      width={16}
      height={12}
      aria-hidden
      className={cn("shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]", className)}
    >
      <rect width="16" height="12" fill="#009C3B" />
      <path d="M8 1.6 14.4 6 8 10.4 1.6 6Z" fill="#FFDF00" />
      <circle cx="8" cy="6" r="2.6" fill="#002776" />
      <path d="M5.5 5.4c1.7-.4 3.5-.2 5 .7" stroke="#fff" strokeWidth="0.5" fill="none" />
    </svg>
  );
}
