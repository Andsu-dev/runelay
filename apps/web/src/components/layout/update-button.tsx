import { Download04Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Popover } from "@/components/ui/overlay/popover";
import { toast } from "@/lib/toast";
import {
  DESKTOP_DOWNLOAD_URL,
  startUpdate,
  UPDATE_COMMAND,
  versionQuery,
  waitForVersionChange,
} from "@/modules/system/api/system.api";
import { ReleaseNotes } from "@/modules/system/components/release-notes";

export function UpdateButton() {
  const { data } = useQuery(versionQuery);
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!data?.updateAvailable) return null;

  const copyCommand = () =>
    navigator.clipboard.writeText(UPDATE_COMMAND).then(
      () => {
        setOpen(false);
        toast("Comando copiado. Rode no servidor para atualizar.", "info");
      },
      () => toast(UPDATE_COMMAND, "info", 8000),
    );

  const update = () => {
    setOpen(false);
    setUpdating(true);
    startUpdate()
      .then(() => {
        toast(`Atualizando para a ${data.latest}. A página recarrega sozinha.`, "info", 6000);
        return waitForVersionChange(data.current);
      })
      .then((changed) => {
        if (changed) return window.location.reload();
        setUpdating(false);
        toast("A atualização não terminou. Veja os logs do servidor.", "error");
      })
      .catch((error: Error) => {
        setUpdating(false);
        toast(error.message, "error");
      });
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side="right"
      align="end"
      sideOffset={10}
      className="w-80 p-0"
      trigger={
        <motion.button
          type="button"
          disabled={updating}
          aria-label={updating ? `Atualizando para a ${data.latest}` : `runelay ${data.latest} disponível`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          data-sound="open"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 not-disabled:hover:bg-foreground/[0.06] not-disabled:hover:text-foreground disabled:opacity-70"
        >
          <HugeiconsIcon
            icon={updating ? RefreshIcon : Download04Icon}
            size={16}
            strokeWidth={1.6}
            className={updating ? "animate-spin" : undefined}
          />
          {!updating && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-foreground" />}
        </motion.button>
      }
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold">runelay {data.latest} disponível</span>
          <span className="text-[12px] text-muted-foreground">Você está na {data.current}.</span>
        </div>
        {data.notes && <ReleaseNotes notes={data.notes} />}
        {data.releaseUrl && (
          <a
            href={data.releaseUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ver a release no GitHub
          </a>
        )}
        <p className="text-[12px] text-muted-foreground">
          {data.desktop
            ? "Baixe o app novo e arraste para Aplicativos. Seus dados ficam."
            : data.canUpdate
              ? "O servidor baixa a versão nova e reinicia em menos de um minuto. A página recarrega sozinha."
              : "Este servidor não atualiza pelo painel. Rode o comando no servidor."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Agora não
          </Button>
          {data.desktop ? (
            <Button size="sm" cue="tap" onClick={() => window.open(DESKTOP_DOWNLOAD_URL, "_blank")}>
              Baixar
            </Button>
          ) : (
            <Button size="sm" cue="tap" onClick={data.canUpdate ? update : copyCommand}>
              {data.canUpdate ? "Atualizar" : "Copiar comando"}
            </Button>
          )}
        </div>
      </div>
    </Popover>
  );
}
