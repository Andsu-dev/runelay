import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";

interface TokenDialogProps {
  name: string;
  tokenUrl: string | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (token: string) => void;
}

export function TokenDialog({ name, tokenUrl, open, pending, onOpenChange, onSubmit }: TokenDialogProps) {
  const t = useT();
  const [token, setToken] = useState("");
  const trimmed = token.trim();

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setToken("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("sources.token.title", { name })}
      description={t("sources.token.description", { name })}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label={t("sources.token.label")}
          hint={
            tokenUrl ? (
              <a
                href={tokenUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("sources.token.create", { name })}
              </a>
            ) : undefined
          }
        >
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t("sources.token.placeholder")}
            autoComplete="off"
            autoFocus
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={pending} disabled={!trimmed}>
            {t("sources.token.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
