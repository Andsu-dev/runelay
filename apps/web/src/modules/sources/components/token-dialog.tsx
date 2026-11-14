import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";

interface TokenDialogProps {
  name: string;
  tokenUrl: string | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (token: string) => void;
}

export function TokenDialog({ name, tokenUrl, open, pending, onOpenChange, onSubmit }: TokenDialogProps) {
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
      title={`Conectar ${name}`}
      description={`O ${name} entra com um token seu. Ele fica cifrado no servidor e os agentes nunca veem.`}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Token"
          hint={
            tokenUrl ? (
              <a
                href={tokenUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                Criar um token no {name}
              </a>
            ) : undefined
          }
        >
          <Input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Cole o token aqui"
            autoComplete="off"
            autoFocus
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={pending} disabled={!trimmed}>
            Conectar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
