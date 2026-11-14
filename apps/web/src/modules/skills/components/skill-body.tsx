import { Edit02Icon } from "@hugeicons/core-free-icons";
import type { SkillView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { Textarea } from "@/components/ui/form/textarea";
import { toast } from "@/lib/toast";
import { skillQuery, updateSkill } from "@/modules/skills/api/skills.api";

interface SkillBodyProps {
  skill: SkillView;
}

export function SkillBody({ skill }: SkillBodyProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(skill.body);

  const save = useMutation({
    mutationFn: () => updateSkill(skill.slug, { body: draft }),
    onSuccess: (updated) => {
      queryClient.setQueryData(skillQuery(skill.slug).queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
      setEditing(false);
      toast("Habilidade salva.");
    },
    onError: (error) => toast(error.message, "error"),
  });

  const startEditing = () => {
    setDraft(skill.body);
    setEditing(true);
  };

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-card p-4 sm:p-5">
      <header className="flex min-h-8 items-center gap-2">
        <h2 className="flex-1 text-[13px] font-semibold">SKILL.md</h2>
        {!editing && <IconAction icon={Edit02Icon} label="Editar" onClick={startEditing} />}
      </header>
      <AnimatePresence initial={false} mode="wait">
        {editing ? (
          <motion.form
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            className="flex flex-col gap-3"
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[50dvh] font-mono text-[12px] leading-relaxed"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="glass" onClick={() => setEditing(false)} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={save.isPending} disabled={draft === skill.body}>
                Salvar
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.pre
            key="read"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="max-h-[70dvh] overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap"
          >
            {skill.body || "Sem conteúdo."}
          </motion.pre>
        )}
      </AnimatePresence>
    </section>
  );
}
