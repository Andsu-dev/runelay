import type { CliAuthRequestView } from "@runelay/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/action/button";
import { UI_SPRING } from "@/components/ui/display/spring";
import { toast } from "@/lib/toast";
import { approveCliAuth } from "@/modules/cli/api/cli-auth.api";
import { CliAuthorized } from "@/modules/cli/components/cli-authorized";

interface CliAuthorizeCardProps {
  request: CliAuthRequestView;
  organizationName: string;
}

export function CliAuthorizeCard({ request, organizationName }: CliAuthorizeCardProps) {
  const navigate = useNavigate();
  const approve = useMutation({
    mutationFn: () => approveCliAuth({ code: request.code }),
    onError: (error) => toast(error.message, "error"),
  });

  const cancel = () => {
    toast("Login do CLI cancelado.", "info");
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
              <h1 className="text-xl font-semibold tracking-[-0.02em]">Autorizar o runelay CLI</h1>
              <p className="text-[13px] text-muted-foreground">
                Pedido de <span className="font-medium text-foreground">{request.device}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl bg-card px-4 py-5 shadow-xs">
            <p className="text-[12px] text-muted-foreground">Confira se é o mesmo código do terminal</p>
            <p className="font-mono text-3xl font-semibold tracking-[0.14em] tabular-nums">{request.code}</p>
          </div>

          <p className="text-center text-[13px] text-muted-foreground">
            O CLI vai ler e gravar memórias, habilidades e conexões da organização{" "}
            <span className="font-medium text-foreground">{organizationName}</span>.
          </p>

          <div className="flex flex-col gap-2">
            <Button size="lg" loading={approve.isPending} onClick={() => approve.mutate()}>
              Autorizar
            </Button>
            <Button size="lg" variant="ghost" disabled={approve.isPending} onClick={cancel}>
              Cancelar
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
