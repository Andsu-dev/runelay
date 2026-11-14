import { InstalledSources } from "./installed-sources";
import type { NavCategory } from "./nav.types";
import { PanelLink } from "./panel-link";
import { PanelSection } from "./panel-section";
import { PanelSoonItem } from "./panel-soon-item";

interface PanelCategoryProps {
  category: NavCategory;
  scope: string;
  onNavigate?: () => void;
}

export function PanelCategory({ category, scope, onNavigate }: PanelCategoryProps) {
  return (
    <div className="flex flex-col gap-5">
      {category.sections.map((section) => (
        <PanelSection key={section.label} label={section.label}>
          {section.items.map((item) =>
            "soon" in item ? (
              <PanelSoonItem key={item.label} item={item} />
            ) : (
              <PanelLink key={item.label} item={item} scope={scope} onNavigate={onNavigate} />
            ),
          )}
        </PanelSection>
      ))}
      {category.showInstalled && <InstalledSources onNavigate={onNavigate} />}
    </div>
  );
}
