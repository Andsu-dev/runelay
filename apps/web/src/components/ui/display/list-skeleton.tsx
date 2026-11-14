import { Skeleton } from "./skeleton";

const ROWS = [0, 1, 2, 3, 4, 5];

interface ListSkeletonProps {
  columns?: 1 | 2;
}

export function ListSkeleton({ columns = 1 }: ListSkeletonProps) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-60 bg-muted/60" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm bg-muted/60" />
      <div className={columns === 2 ? "grid gap-2 md:grid-cols-2" : "flex flex-col gap-2"}>
        {ROWS.map((row) => (
          <Skeleton key={row} className="h-[68px] rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}
