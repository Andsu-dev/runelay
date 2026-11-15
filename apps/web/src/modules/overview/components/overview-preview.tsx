import { PREVIEW_ACTIVITY, PREVIEW_SOURCES } from "@/modules/overview/constants/overview-preview.constants";
import { OverviewEmpty } from "./overview-empty";
import { OverviewWidgets } from "./overview-widgets";

export function OverviewPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        inert
        className="pointer-events-none max-h-[26rem] overflow-hidden opacity-60 blur-[6px] select-none [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black_40%,transparent_100%)] md:max-h-[40rem]"
      >
        <OverviewWidgets activity={PREVIEW_ACTIVITY} sources={PREVIEW_SOURCES} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <OverviewEmpty />
      </div>
    </div>
  );
}
