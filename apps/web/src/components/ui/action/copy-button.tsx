import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { cue } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { IconAction } from "./icon-action";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = "Copiar" }: CopyButtonProps) {
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
      label={copied ? "Copiado" : label}
      onClick={copy}
      cue={false}
      className={cn(copied && "text-success not-disabled:hover:text-success")}
    />
  );
}
