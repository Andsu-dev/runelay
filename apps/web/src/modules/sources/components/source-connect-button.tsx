import type { SourceView } from "@runelay/shared";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSourceActions } from "@/modules/sources/hooks/use-source-actions";
import { TokenDialog } from "./token-dialog";

interface SourceConnectButtonProps {
  source: SourceView;
  className?: string;
}

export function SourceConnectButton({ source, className }: SourceConnectButtonProps) {
  const t = useT();
  const { name, config, status, enabled } = source;
  const { login, startLogin, saveToken } = useSourceActions(name);
  const [asking, setAsking] = useState(false);

  if (config.kind !== "mcp") return null;

  if (source.auth === "api_key") {
    const broken = status !== "ok";
    return (
      <>
        <Button
          size="sm"
          variant={broken ? "default" : "glass"}
          onClick={() => setAsking(true)}
          className={cn(className)}
        >
          {broken ? t("sources.pasteToken") : t("sources.changeToken")}
        </Button>
        <TokenDialog
          name={name}
          tokenUrl={source.tokenUrl}
          open={asking}
          pending={saveToken.isPending}
          onOpenChange={setAsking}
          onSubmit={(token) => saveToken.mutate({ config, token }, { onSuccess: () => setAsking(false) })}
        />
      </>
    );
  }

  const needsLogin = enabled && status === "needs_auth";
  return (
    <Button
      size="sm"
      variant={needsLogin ? "default" : "glass"}
      loading={login.isPending}
      onClick={startLogin}
      className={className}
    >
      {needsLogin ? t("sources.login") : t("sources.reconnect")}
    </Button>
  );
}
