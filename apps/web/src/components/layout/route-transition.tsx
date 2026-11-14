import { Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

export function RouteTransition() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
    >
      <Outlet />
    </motion.div>
  );
}
