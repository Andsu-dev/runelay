import { AUTHOR } from "@/constants/author.constants";
import { XIcon } from "./x-icon";

export function AuthorHandleLink() {
  return (
    <a
      href={AUTHOR.url}
      target="_blank"
      rel="noreferrer"
      className="mx-auto flex w-fit items-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
    >
      <XIcon size={12} />@{AUTHOR.handle}
    </a>
  );
}
