import type { SkillListItemView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { MonogramTile } from "@/components/ui/display/monogram-tile";
import { Switch } from "@/components/ui/form/switch";
import { useSkillToggle } from "@/modules/skills/hooks/use-skill-toggle";

interface SkillRowProps {
  skill: SkillListItemView;
}

export function SkillRow({ skill }: SkillRowProps) {
  const toggle = useSkillToggle(skill.slug, skill.name);

  return (
    <div className="group relative flex min-h-16 items-start gap-3 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-muted/50">
      <MonogramTile label={skill.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to="/skills/$slug"
          params={{ slug: skill.slug }}
          className="truncate text-[13px] font-semibold after:absolute after:inset-0 after:rounded-xl after:content-['']"
        >
          {skill.name}
        </Link>
        <p className="line-clamp-2 text-[12px] text-muted-foreground">{skill.description || skill.slug}</p>
      </div>
      <Switch
        checked={skill.enabled}
        disabled={toggle.isPending}
        label={skill.enabled ? `Desativar ${skill.name}` : `Ativar ${skill.name}`}
        onCheckedChange={(next) => toggle.mutate(next)}
        className="relative z-10 mt-1.5"
      />
    </div>
  );
}
