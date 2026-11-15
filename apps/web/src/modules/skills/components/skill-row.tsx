import type { SkillListItemView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { MaskedName } from "@/components/ui/display/masked-name";
import { MonogramTile } from "@/components/ui/display/monogram-tile";
import { Switch } from "@/components/ui/form/switch";
import { maskName, useNamesHidden } from "@/lib/hidden-names";
import { useT } from "@/lib/i18n";
import { useSkillToggle } from "@/modules/skills/hooks/use-skill-toggle";

interface SkillRowProps {
  skill: SkillListItemView;
}

export function SkillRow({ skill }: SkillRowProps) {
  const t = useT();
  const toggle = useSkillToggle(skill.slug, skill.name);
  const hidden = useNamesHidden();
  const name = hidden ? maskName(skill.name) : skill.name;

  return (
    <div className="group relative flex min-h-16 items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-muted/50">
      <MonogramTile label={name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to="/skills/$slug"
          params={{ slug: skill.slug }}
          className="truncate text-[13px] font-semibold after:absolute after:inset-0 after:rounded-xl after:content-['']"
        >
          <MaskedName value={skill.name} />
        </Link>
        <p className="line-clamp-2 text-[12px] text-muted-foreground">
          {skill.description || <MaskedName value={skill.slug} />}
        </p>
      </div>
      <Switch
        checked={skill.enabled}
        disabled={toggle.isPending}
        label={t(skill.enabled ? "skills.detail.disable" : "skills.detail.enable", { name })}
        onCheckedChange={(next) => toggle.mutate(next)}
        className="relative z-10 mt-1.5"
      />
    </div>
  );
}
