import { useState } from "react";
import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  seed: string;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, seed, image, className }: UserAvatarProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  if (image && image !== failedImage)
    return (
      <img
        src={image}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setFailedImage(image)}
        className={cn("size-6 shrink-0 rounded-full bg-muted object-cover", className)}
      />
    );

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
