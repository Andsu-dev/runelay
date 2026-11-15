import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CommandBlock } from "@/components/ui/display/command-block";
import { useT } from "@/lib/i18n";
import { CLIENT_SNIPPETS } from "@/modules/api-keys/constants/client-snippets.constants";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";
import { ClientChip } from "./client-chip";

interface ClientBranchesProps {
  apiKey: string;
  secret: string | null;
}

const FORK = "M1 0 C1 14, 8 20, 24 20";

export function ClientBranches({ apiKey, secret }: ClientBranchesProps) {
  const t = useT();
  const [selected, setSelected] = useState<string>(CLIENT_SNIPPETS[0].client);
  const url = `${window.location.origin}/v1/mcp`;
  const active = CLIENT_SNIPPETS.find((snippet) => snippet.client === selected);

  return (
    <div className="relative pl-8">
      <svg aria-hidden viewBox="0 0 26 22" className="absolute top-0 left-0 h-[22px] w-[26px] overflow-visible">
        <motion.path
          d={FORK}
          fill="none"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, ease: TIMELINE_EASE, delay: 0.1 }}
          className="stroke-foreground/40"
        />
      </svg>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {CLIENT_SNIPPETS.map((snippet, order) => (
            <ClientChip
              key={snippet.client}
              client={"labelKey" in snippet ? t(snippet.labelKey) : snippet.client}
              logo={snippet.logo}
              order={order}
              selected={selected === snippet.client}
              onSelect={() => setSelected(snippet.client)}
            />
          ))}
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {active && (
            <motion.div
              key={active.client}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: TIMELINE_EASE }}
              className="flex flex-col gap-1.5"
            >
              <span className="text-xs text-muted-foreground">
                {"fileKey" in active ? t(active.fileKey) : active.file}
              </span>
              <CommandBlock
                value={active.build(url, apiKey)}
                secret={secret}
                label={t("setup.copyClientConfig", {
                  client: "labelKey" in active ? t(active.labelKey) : active.client,
                })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
