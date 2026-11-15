import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/action/button";
import { PageHeader } from "@/components/ui/display/page-header";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { ReconnectDone } from "@/modules/reconnect/components/reconnect-done";
import { ReconnectProgress } from "@/modules/reconnect/components/reconnect-progress";
import { ReconnectRow } from "@/modules/reconnect/components/reconnect-row";
import { useReconnectQueue } from "@/modules/reconnect/hooks/use-reconnect-queue";

export function ReconnectQueue() {
  const t = useT();
  const {
    initial,
    connected,
    queue,
    current,
    skippedCount,
    waitingFor,
    starting,
    connectCurrent,
    skipCurrent,
    stateOf,
  } = useReconnectQueue();
  const started = connected.length > 0 || skippedCount > 0 || waitingFor !== null;
  const title = t.plural("reconnect.queue.remaining", queue.length);

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={current ? title : t("reconnect.queue.title")} description={t("reconnect.queue.description")} />
      {initial.length > 0 && <ReconnectProgress done={connected.length} total={initial.length} />}
      <AnimatePresence mode="wait" initial={false}>
        {current ? (
          <motion.div key="queue" exit={{ opacity: 0, y: -6 }} transition={UI_SPRING} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button loading={starting} onClick={connectCurrent}>
                {started ? t("reconnect.queue.connect", { name: current.name }) : t("reconnect.queue.connectAll")}
              </Button>
              <Button variant="ghost" disabled={starting} onClick={skipCurrent}>
                {t("reconnect.queue.skip")}
              </Button>
            </div>
            <ul className="flex flex-col gap-2">
              {initial.map((source) => (
                <motion.li
                  key={source.name}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...UI_SPRING, mass: 0.7 }}
                >
                  <ReconnectRow source={source} state={stateOf(source.name)} />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : (
          <ReconnectDone key="done" connected={connected.length} skipped={skippedCount} />
        )}
      </AnimatePresence>
    </section>
  );
}
