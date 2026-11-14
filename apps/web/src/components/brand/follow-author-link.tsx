import { buttonVariants } from "@/components/ui/action/button";
import { AUTHOR } from "@/constants/author.constants";
import { XIcon } from "./x-icon";

interface FollowAuthorLinkProps {
  variant?: "default" | "glass";
  size?: "sm" | "default";
  className?: string;
}

export function FollowAuthorLink({ variant = "default", size = "default", className }: FollowAuthorLinkProps) {
  return (
    <a
      href={AUTHOR.url}
      target="_blank"
      rel="noreferrer"
      data-sound="tap"
      className={buttonVariants({ variant, size, className })}
    >
      <XIcon />
      Seguir @{AUTHOR.handle}
    </a>
  );
}
