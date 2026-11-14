import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Skeleton } from "@/components/ui/display/skeleton";
import { skillFileQuery } from "@/modules/skills/api/skills.api";

interface SkillFileContentProps {
  slug: string;
  path: string;
}

export function SkillFileContent({ slug, path }: SkillFileContentProps) {
  const { data: file, error } = useQuery(skillFileQuery(slug, path));

  return (
    <AnimatePresence initial={false} mode="wait">
      {file ? (
        <motion.pre
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="max-h-[60dvh] overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap"
        >
          {file.content}
        </motion.pre>
      ) : error ? (
        <p key="error" className="text-[13px] text-destructive">
          {error.message}
        </p>
      ) : (
        <motion.div key="loading" exit={{ opacity: 0 }} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
