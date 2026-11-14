import { Fragment } from "react";

interface ReleaseNotesProps {
  notes: string;
}

const inline = (text: string) =>
  text
    .replaceAll("**", "")
    .split("`")
    .map((part, position) =>
      position % 2 === 1 ? (
        <code key={part} className="rounded bg-muted px-1 py-px font-mono text-[11px]">
          {part}
        </code>
      ) : (
        <Fragment key={part}>{part}</Fragment>
      ),
    );

export function ReleaseNotes({ notes }: ReleaseNotesProps) {
  const lines = notes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("```"));

  return (
    <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto overscroll-contain pr-1 text-[12px] leading-relaxed text-muted-foreground">
      {lines.map((line) =>
        line.startsWith("#") ? (
          <p key={line} className="pt-1 text-[11px] font-semibold tracking-wide text-foreground uppercase">
            {line.replace(/^#+\s*/, "")}
          </p>
        ) : line.startsWith("- ") ? (
          <p key={line} className="flex gap-2">
            <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
            <span>{inline(line.slice(2))}</span>
          </p>
        ) : (
          <p key={line}>{inline(line)}</p>
        ),
      )}
    </div>
  );
}
