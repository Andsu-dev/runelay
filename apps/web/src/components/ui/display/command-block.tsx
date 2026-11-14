import { CopyButton } from "@/components/ui/action/copy-button";

interface CommandBlockProps {
  value: string;
  secret?: string | null;
  label?: string;
}

const MASK = "x7Kq2mPz9LwR4vTn";

const segmentsOf = (value: string, secret: string | null | undefined) => {
  if (!secret) return [{ key: "all", text: value, masked: false }];
  const parts = value.split(secret);
  let offset = 0;
  return parts.map((text, position) => {
    const segment = { key: `at-${offset}`, text, masked: position < parts.length - 1 };
    offset += text.length + secret.length;
    return segment;
  });
};

export function CommandBlock({ value, secret, label = "Copiar comando" }: CommandBlockProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/60 py-1 pr-1 pl-3">
      <pre className="min-w-0 flex-1 overflow-x-auto py-1.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
        {segmentsOf(value, secret).map((segment) => (
          <span key={segment.key}>
            {segment.text}
            {segment.masked && secret && (
              <span>
                {secret.slice(0, 4)}
                <span aria-hidden className="select-none blur-[3px]">
                  {MASK}
                </span>
                <span className="sr-only">chave oculta</span>
              </span>
            )}
          </span>
        ))}
      </pre>
      <CopyButton value={value} label={label} />
    </div>
  );
}
