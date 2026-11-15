import { Skeleton } from "@/components/ui/display/skeleton";

const TILES = [0, 1, 2, 3];
const ROWS = [0, 1, 2, 3, 4, 5];

export function ActivityStatsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {TILES.map((tile) => (
          <Skeleton key={tile} className="h-28 rounded-xl bg-muted/60" />
        ))}
      </div>
      {ROWS.map((row) => (
        <Skeleton key={row} className="h-11 rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}
