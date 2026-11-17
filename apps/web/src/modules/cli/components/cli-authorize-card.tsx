import type { CliAuthRequestView } from "@runelay/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/action/button";
import { UI_SPRING } from "@/components/ui/display/spring";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { approveCliAuth } from "@/modules/cli/api/cli-auth.api";
import { CliAuthorized } from "@/modules/cli/components/cli-authorized";

interface CliAuthorizeCardProps {
  request: CliAuthRequestView;
}

const UNKNOWN_USER_PREFIX = "unknown@";

const deviceLabel = (device: string) =>
  device.startsWith(UNKNOWN_USER_PREFIX) ? device.slice(UNKNOWN_USER_PREFIX.length) : device;

export function CliAuthorizeCard({ request }: CliAuthorizeCardProps) {
  const t = useT();
  const navigate = useNavigate();
  const approve = useMutation({
    mutationFn: () => approveCliAuth({ code: request.code }),
    onError: (error) => toast(translateError(error), "error"),
  });

  const cancel = () => {
    toast(translate("cli.authorize.cancelled"), "info");
    navigate({ to: "/overview" });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {approve.isSuccess ? (
        <CliAuthorized key="done" />
      ) : (
        <motion.div
          key="ask"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          transition={UI_SPRING}
          className="flex w-full flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-app-icon shadow-lg">
              <LogoMark className="size-8" entrance />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-[-0.02em]">{t("cli.authorize.title")}</h1>
              <p className="text-[13px] text-muted-foreground">
                {t("cli.authorize.requestFrom")}{" "}
                <span className="font-medium text-foreground">{deviceLabel(request.device)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl bg-card px-4 py-5 shadow-xs">
            <p className="text-[12px] text-muted-foreground">{t("cli.authorize.checkCode")}</p>
            <p className="font-mono text-3xl font-semibold tracking-[0.14em] tabular-nums">{request.code}</p>
          </div>

          <p className="text-center text-[13px] text-muted-foreground">{t("cli.authorize.scope")}</p>

          <div className="flex flex-col gap-2">
            <Button size="lg" loading={approve.isPending} onClick={() => approve.mutate()}>
              {t("cli.authorize.approve")}
            </Button>
            <Button size="lg" variant="ghost" disabled={approve.isPending} onClick={cancel}>
              {t("cli.authorize.cancel")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
