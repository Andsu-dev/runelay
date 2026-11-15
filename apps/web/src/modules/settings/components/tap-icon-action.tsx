import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { IconAction } from "@/components/ui/action/icon-action";

export function TapIconAction(props: ComponentProps<typeof IconAction>) {
  return (
    <motion.span whileTap={props.disabled ? undefined : { scale: 0.88 }} className="flex">
      <IconAction {...props} />
    </motion.span>
  );
}
