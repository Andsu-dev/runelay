import {
  Add01Icon,
  Cancel01Icon,
  File01Icon,
  Link01Icon,
  MagicWand01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SKILL_DOCUMENT_LIMIT, skillDocumentFilenameSchema } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Dialog } from "@/components/ui/overlay/dialog";
import { translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { discoverGithubSkills, installGithubSkill, skillQuery, uploadSkill } from "@/modules/skills/api/skills.api";

type SkillInstall = { file: File } | { repository: string; path: string };

export function AddSkillDialog() {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const [source, setSource] = useState("");
  const [selection, setSelection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);

  const discover = useMutation({
    mutationFn: discoverGithubSkills,
    onSuccess: (skills) => setSelection(skills.length === 1 ? (skills[0]?.path ?? "") : ""),
  });

  const install = useMutation({
    mutationFn: async (input: SkillInstall) => {
      if ("repository" in input) return installGithubSkill(input.repository, input.path);
      const content = new TextDecoder("utf-8", { fatal: true }).decode(await input.file.arrayBuffer());
      return uploadSkill(input.file.name, content);
    },
    onSuccess: (skill) => {
      queryClient.setQueryData(skillQuery(skill.slug).queryKey, skill);
      queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
      toast(t("skills.add.installed", { name: skill.name }));
      setOpen(false);
      setMode("file");
      setSource("");
      setSelection("");
      setFile(null);
      discover.reset();
      navigate({ to: "/skills/$slug", params: { slug: skill.slug } });
    },
  });

  const busy = discover.isPending || install.isPending;
  const chooseFile = (next: File) => {
    if (busy) return;
    const invalid =
      !skillDocumentFilenameSchema.safeParse(next.name).success || !next.size || next.size > SKILL_DOCUMENT_LIMIT;
    setFileError(invalid);
    if (invalid) return;
    setFile(next);
    install.reset();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (mode === "file") {
      if (file) install.mutate({ file });
    } else if (source.trim()) {
      if (selection) install.mutate({ repository: source.trim(), path: selection });
      else if (!discover.data) discover.mutate(source.trim());
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={t("skills.add.action")}
      description={t("skills.add.description")}
      icon={MagicWand01Icon}
      contentClassName="sm:max-w-[30rem] sm:p-6"
      bodyClassName="sm:-mx-6 sm:px-6 sm:-mb-6 sm:pb-6"
      overlayClassName="bg-background/65 backdrop-blur-[3px]"
      trigger={
        <Button size="sm">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={1.8} />
          {t("skills.add.action")}
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SegmentedControl
          fullWidth
          label={t("skills.add.method")}
          value={mode}
          onChange={(next) => {
            if (busy || next === mode) return;
            setMode(next);
            setFileError(false);
            install.reset();
          }}
          options={[
            { value: "file", label: t("skills.add.fileTab"), icon: File01Icon },
            { value: "link", label: t("skills.add.linkTab"), icon: Link01Icon },
          ]}
        />
        {mode === "file" ? (
          file ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/65 p-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={File01Icon} size={18} strokeWidth={1.6} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{file.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{Math.max(1, Math.ceil(file.size / 1000))} KB</p>
              </div>
              <IconAction
                type="button"
                icon={Cancel01Icon}
                label={t("skills.add.removeFile")}
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  setFileError(false);
                  install.reset();
                }}
              />
            </div>
          ) : (
            <label
              className={cn(
                "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl bg-muted/45 px-4 py-5 text-center ring-1 ring-border/80 ring-inset transition-[background-color,box-shadow] duration-200 hover:bg-muted/65 focus-within:ring-2 focus-within:ring-ring/30",
                dragging && "bg-primary/10 ring-2 ring-primary/50",
              )}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy && event.dataTransfer.types.includes("Files")) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const next = event.dataTransfer.files[0];
                if (next) chooseFile(next);
              }}
            >
              <input
                type="file"
                accept=".md,.markdown,.txt"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  const next = event.target.files?.[0];
                  if (next) chooseFile(next);
                  event.target.value = "";
                }}
              />
              <motion.span
                className="grid size-11 place-items-center rounded-xl bg-background/75 text-foreground shadow-sm ring-1 ring-border/75 ring-inset"
                animate={{ scale: dragging ? 1.1 : 1, y: dragging ? -2 : 0 }}
                transition={reducedMotion ? UI_REDUCED_MOTION : UI_SPRING}
              >
                <HugeiconsIcon icon={Upload04Icon} size={20} strokeWidth={1.6} aria-hidden />
              </motion.span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t(dragging ? "skills.add.dropNow" : "skills.add.upload")}</span>
                <span className="text-xs text-muted-foreground">{t("skills.add.uploadHint")}</span>
              </span>
            </label>
          )
        ) : (
          <>
            <div className="flex items-end gap-2">
              <Field label={t("skills.add.source")} className="min-w-0 flex-1">
                <Input
                  value={source}
                  spellCheck={false}
                  autoComplete="off"
                  maxLength={500}
                  placeholder="https://github.com/owner/repo"
                  className="h-10"
                  disabled={busy}
                  onChange={(event) => {
                    setSource(event.target.value);
                    setSelection("");
                    discover.reset();
                    install.reset();
                  }}
                />
              </Field>
              <Button
                type="button"
                size="lg"
                className="px-3 sm:px-4"
                disabled={!source.trim() || install.isPending}
                loading={discover.isPending}
                onClick={() => {
                  setSelection("");
                  install.reset();
                  discover.mutate(source.trim());
                }}
              >
                {t("skills.add.discover")}
              </Button>
            </div>
            {discover.error && (
              <p role="alert" className="text-[13px] text-destructive">
                {translateError(discover.error)}
              </p>
            )}
            {discover.data?.length ? (
              <Field label={t("skills.add.choose")}>
                <select
                  className="min-h-9 w-full rounded-lg bg-muted px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  value={selection}
                  disabled={install.isPending}
                  onChange={(event) => {
                    setSelection(event.target.value);
                    install.reset();
                  }}
                >
                  <option value="" disabled>
                    {t("skills.add.choose")}
                  </option>
                  {discover.data.map(({ name, path }) => (
                    <option key={path} value={path}>
                      {path === "." || path === name ? name : path}
                    </option>
                  ))}
                </select>
              </Field>
            ) : discover.data ? (
              <p role="status" className="text-[13px] text-muted-foreground">
                {t("skills.add.empty")}
              </p>
            ) : null}
          </>
        )}
        {mode === "file" && fileError && (
          <p role="alert" className="text-[13px] text-destructive">
            {t("skills.add.invalidFile")}
          </p>
        )}
        {install.error && (
          <p role="alert" className="text-[13px] text-destructive">
            {translateError(install.error)}
          </p>
        )}
        {(mode === "file" ? file : selection) && (
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={install.isPending}
              disabled={discover.isPending}
              loadingText={t("skills.add.installing")}
            >
              {t("skills.add.install")}
            </Button>
          </div>
        )}
      </form>
    </Dialog>
  );
}
