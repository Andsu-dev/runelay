import { ArrowDown01Icon, ArrowUpRight01Icon, Key01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createApiKeySchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { apiKeysQuery, createApiKey } from "@/modules/api-keys/api/api-keys.api";
import { MCP_PATH } from "@/modules/settings/constants/settings.constants";
import { GUIDES_URL } from "@/modules/setup/constants/setup.constants";

const mcpConfig = (url: string, key: string) =>
  JSON.stringify({ mcpServers: { runelay: { url, headers: { Authorization: `Bearer ${key}` } } } }, null, 2);

export function ManualAgentPanel() {
  const t = useT();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const spring = reduce ? UI_REDUCED_MOTION : UI_SPRING;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => t("setup.desktop.manual.defaultName"));
  const parsed = createApiKeySchema.safeParse({ name });
  const url = `${window.location.origin}${MCP_PATH}`;

  const create = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeysQuery.queryKey }),
    onError: (error) => toast(translateError(error), "error"),
  });
  const key = create.data?.key ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (parsed.success) create.mutate(parsed.data);
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer self-start"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="manual-agent-panel"
      >
        {t("setup.desktop.manual.toggle")}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={1.8}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="manual"
            id="manual-agent-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 rounded-lg bg-muted/60 p-4 dark:bg-muted/40">
              <p className="text-[13px] text-pretty text-muted-foreground">{t("setup.desktop.manual.explain")}</p>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">{t("setup.desktop.manual.serverUrl")}</span>
                <CommandBlock value={url} label={t("setup.desktop.manual.copyUrl")} />
              </div>
              <AnimatePresence initial={false} mode="wait">
                {key ? (
                  <motion.div
                    key="created"
                    initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                    transition={spring}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[13px] font-medium">{t("setup.desktop.manual.header")}</span>
                      <CommandBlock
                        value={`Authorization: Bearer ${key}`}
                        secret={key}
                        label={t("setup.desktop.manual.copyHeader")}
                      />
                      <span className="text-xs text-pretty text-muted-foreground">
                        {t("setup.desktop.manual.onceNote")}{" "}
                        <Link to="/api-keys" className="font-medium text-foreground underline-offset-4 hover:underline">
                          {t("setup.desktop.manual.keysLink")}
                        </Link>
                        .
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[13px] font-medium">{t("setup.desktop.manual.json")}</span>
                      <CommandBlock
                        value={mcpConfig(url, key)}
                        secret={key}
                        label={t("setup.desktop.manual.copyJson")}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={spring}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <Field label={t("setup.desktop.manual.name")} className="min-w-48 flex-1">
                      <Input value={name} onChange={(event) => setName(event.target.value)} />
                    </Field>
                    <Button
                      type="submit"
                      className="cursor-pointer"
                      loading={create.isPending}
                      disabled={!parsed.success}
                      aria-label={t("setup.desktop.manual.generateLabel")}
                    >
                      <HugeiconsIcon icon={Key01Icon} strokeWidth={1.7} />
                      {t("setup.desktop.manual.generate")}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
              <a
                href={GUIDES_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1 self-start text-[13px] font-medium underline-offset-4 hover:underline"
              >
                {t("setup.desktop.manual.guides")}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={13}
                  strokeWidth={2}
                  className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
