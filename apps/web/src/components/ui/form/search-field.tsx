import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface SearchFieldProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  delay?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchField({ value, onSearch, placeholder, delay = 280, className, autoFocus }: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(next.trim()), delay);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        strokeWidth={1.6}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={draft}
        onChange={change}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="h-11 pl-9 sm:h-9 [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
