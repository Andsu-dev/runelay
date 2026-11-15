import { Cancel01Icon, PencilEdit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useState } from "react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";
import { TapIconAction } from "./tap-icon-action";

interface InlineEditTextProps {
  value: string;
  normalize: (draft: string) => string | null;
  onSave: (next: string) => void;
  inputLabel: string;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  textClassName?: string;
}

const focusAndSelect = (node: HTMLInputElement | null) => {
  node?.focus();
  node?.select();
};

const SWAP = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
};

const FADE = {
  initial: { opacity: 0, y: 4, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(3px)" },
};

export function InlineEditText({
  value,
  normalize,
  onSave,
  inputLabel,
  editLabel,
  saveLabel,
  cancelLabel,
  disabled = false,
  textClassName,
}: InlineEditTextProps) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? UI_REDUCED_MOTION : UI_SPRING;
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  const next = editing ? normalize(draft) : null;
  const canSave = Boolean(next) && next !== value;

  const cancel = () => setDraft(null);

  const save = () => {
    if (!canSave || !next) return;
    setDraft(null);
    onSave(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
  };

  const handleBlur = () => {
    if ((draft ?? "").trim() === value) cancel();
  };

  return (
    <motion.div layout transition={transition} className="flex min-h-8 min-w-0 items-center gap-2">
      <div className="grid min-w-0 flex-1 items-center">
        <AnimatePresence initial={false}>
          {editing ? (
            <motion.input
              key="input"
              {...(reducedMotion ? {} : FADE)}
              transition={transition}
              ref={focusAndSelect}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              aria-label={inputLabel}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              spellCheck={false}
              className={cn(
                "-mx-2 h-8 min-w-0 rounded-md bg-muted/70 px-2 text-[13px] text-foreground outline-none [grid-area:1/1] selection:bg-foreground/15 dark:bg-input/50",
                textClassName,
              )}
            />
          ) : (
            <motion.span
              key="text"
              {...(reducedMotion ? {} : FADE)}
              transition={transition}
              className={cn(
                "flex h-8 min-w-0 items-center truncate text-[13px] text-muted-foreground [grid-area:1/1]",
                textClassName,
              )}
            >
              {value}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 items-center">
        <AnimatePresence initial={false} mode="popLayout">
          {editing ? (
            <motion.div key="editing" {...SWAP} transition={transition} className="flex items-center">
              <TapIconAction icon={Tick02Icon} label={saveLabel} disabled={!canSave} onClick={save} />
              <TapIconAction icon={Cancel01Icon} label={cancelLabel} onClick={cancel} />
            </motion.div>
          ) : (
            <motion.div key="idle" {...SWAP} transition={transition} className="flex items-center">
              <TapIconAction
                icon={PencilEdit02Icon}
                label={editLabel}
                disabled={disabled}
                onClick={() => setDraft(value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
