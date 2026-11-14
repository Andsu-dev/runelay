import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, useRef, useState } from "react";
import { CommandResults } from "./command-results";

interface CommandPanelProps {
  onNavigate: () => void;
}

export function CommandPanel({ onNavigate }: CommandPanelProps) {
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTerm(next.trim()), 220);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <label className="flex items-center gap-2.5 border-b border-border/60 px-4">
        <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
        <input
          value={draft}
          onChange={change}
          placeholder="Buscar memórias, habilidades e tools"
          aria-label="Buscar"
          className="h-13 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        <kbd className="hidden rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
          esc
        </kbd>
      </label>
      <div className="max-h-[min(60dvh,26rem)] overflow-y-auto overscroll-contain p-1.5">
        <CommandResults term={term} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
