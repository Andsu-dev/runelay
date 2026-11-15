import { Key01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { useT } from "@/lib/i18n";
import { CreateApiKeyDialog } from "@/modules/api-keys/components/create-api-key-dialog";
import { meQuery } from "@/modules/auth/api/session.api";
import { contextCommands } from "@/modules/setup/constants/setup.constants";
import { useSetupKey } from "@/modules/setup/hooks/use-setup-key";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";
import type { SetupStepId } from "@/modules/setup/types/setup.types";
import { ClientBranches } from "./client-branches";
import { ExistingKeysNote } from "./existing-keys-note";
import { SetupProgress } from "./setup-progress";
import { TimelineStep } from "./timeline-step";

export function SetupGuide() {
  const t = useT();
  const { data: me } = useSuspenseQuery(meQuery);
  const [creating, setCreating] = useState(false);
  const { key: apiKey, latest } = useSetupKey();
  const { steps, activeId, markDone, toggle, completed, total } = useSetupProgress(me.organization.id, {
    api_key: apiKey !== null,
  });
  const key = apiKey ?? t("setup.keyPlaceholder");
  const commands = contextCommands(window.location.origin, key);

  const content: Record<SetupStepId, { body?: ReactNode; action?: ReactNode }> = {
    source: {
      action: (
        <Link to="/connectors" search={{ tab: "catalog" }} className={buttonVariants({ variant: "glass", size: "sm" })}>
          <HugeiconsIcon icon={Store01Icon} strokeWidth={1.6} />
          {t("setup.openCatalog")}
        </Link>
      ),
    },
    api_key: apiKey
      ? {
          body: <ExistingKeysNote latest={latest} apiKey={apiKey} />,
        }
      : {
          body: <ExistingKeysNote latest={latest} apiKey={null} />,
          action: (
            <Button size="sm" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={Key01Icon} strokeWidth={1.6} />
              {t(steps.find((step) => step.id === "api_key")?.done ? "setup.createAnotherKey" : "setup.createKey")}
            </Button>
          ),
        },
    agent: { body: <ClientBranches apiKey={key} secret={apiKey} /> },
    import: { body: <CommandBlock value={commands.importContext} secret={apiKey} /> },
    sync: { body: <CommandBlock value={commands.syncContext} secret={apiKey} /> },
  };

  return (
    <div className="flex flex-col gap-6">
      <SetupProgress completed={completed} total={total} />
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <TimelineStep
            key={step.id}
            step={step}
            open={activeId === step.id}
            last={index === steps.length - 1}
            onToggle={() => toggle(step.id)}
            onComplete={() => markDone(step.id)}
            body={content[step.id].body}
            action={content[step.id].action}
          />
        ))}
      </ol>
      <CreateApiKeyDialog open={creating} onOpenChange={setCreating} showClientSnippets={false} />
    </div>
  );
}
