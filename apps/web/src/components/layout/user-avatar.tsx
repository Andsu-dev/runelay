import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  seed: string;
  className?: string;
}

export function UserAvatar({ name, seed, className }: UserAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-black/70 uppercase",
        avatarGradient(seed),
        className,
      )}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
