import { Skeleton } from "@/components/ui/display/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48 bg-muted/60" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-44 rounded-xl bg-muted/60" />
        <Skeleton className="h-44 rounded-xl bg-muted/60" />
        <Skeleton className="h-44 rounded-xl bg-muted/60" />
        <Skeleton className="h-80 rounded-xl bg-muted/60 md:col-span-3" />
        <Skeleton className="h-64 rounded-xl bg-muted/60" />
        <Skeleton className="h-64 rounded-xl bg-muted/60" />
        <Skeleton className="h-64 rounded-xl bg-muted/60" />
        <Skeleton className="h-72 rounded-xl bg-muted/60 md:col-span-2" />
        <Skeleton className="h-72 rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}
