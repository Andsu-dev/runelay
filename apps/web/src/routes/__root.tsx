import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { PageTransitionOverlay } from "@/components/layout/page-transition-overlay";
import { Toaster } from "@/components/ui/overlay/toaster";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-dvh bg-sidebar text-foreground antialiased">
      <Outlet />
      <Toaster />
      <PageTransitionOverlay />
    </div>
  );
}
