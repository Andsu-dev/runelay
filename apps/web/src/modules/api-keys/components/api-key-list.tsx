import type { ApiKeyView } from "@runeley/shared";
import { AnimatePresence, motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { ApiKeyRow } from "./api-key-row";

interface ApiKeyListProps {
  apiKeys: ApiKeyView[];
}

export function ApiKeyList({ apiKeys }: ApiKeyListProps) {
  if (apiKeys.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
        Nenhuma chave ainda. Crie uma para cada agente que vai usar o runeley.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {apiKeys.map((apiKey) => (
          <motion.li
            key={apiKey.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ...UI_SPRING, mass: 0.7 }}
            className="overflow-hidden"
          >
            <ApiKeyRow apiKey={apiKey} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
