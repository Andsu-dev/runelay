import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { cue } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { IconAction } from "./icon-action";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    cue("success");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <IconAction
      icon={copied ? Tick02Icon : Copy01Icon}
      label={copied ? t("common.actions.copied") : (label ?? t("common.actions.copy"))}
      onClick={copy}
      cue={false}
      className={cn(copied && "text-success not-disabled:hover:text-success")}
    />
  );
}
