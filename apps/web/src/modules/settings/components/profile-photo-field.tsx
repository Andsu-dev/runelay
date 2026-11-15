import { Camera01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AuthUser } from "@runelay/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ChangeEvent, useState } from "react";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { translate, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { AVATAR_ACCEPTED_TYPES, AVATAR_MAX_UPLOAD_BYTES } from "@/modules/settings/constants/settings.constants";
import { useUpdateProfile } from "@/modules/settings/hooks/use-update-profile";
import { resizeAvatar } from "@/modules/settings/utils/resize-avatar";

interface ProfilePhotoFieldProps {
  user: AuthUser;
}

export function ProfilePhotoField({ user }: ProfilePhotoFieldProps) {
  const update = useUpdateProfile();
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const transition = reducedMotion ? UI_REDUCED_MOTION : UI_SPRING;

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      toast(translate("settings.profile.invalidImageType"), "error");
      return;
    }
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      toast(translate("settings.profile.imageTooLarge"), "error");
      return;
    }
    const image = await resizeAvatar(file).catch(() => null);
    if (!image) {
      toast(translate("settings.profile.unreadableImage"), "error");
      return;
    }
    update.mutate({ image }, { onSuccess: () => toast(translate("settings.profile.photoUpdated")) });
  };

  const remove = () =>
    update.mutate({ image: null }, { onSuccess: () => toast(translate("settings.profile.photoRemoved")) });

  return (
    <div className="flex items-center gap-4">
      <motion.div
        whileHover={reducedMotion ? undefined : { scale: 1.04 }}
        transition={transition}
        className="grid size-16 shrink-0"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={user.image ?? "monogram"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.28, ease: [0.2, 0, 0, 1] }}
            className="[grid-area:1/1]"
          >
            <UserAvatar name={user.name} seed={user.id} image={user.image} className="size-16 text-xl" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          data-sound="tap"
          aria-disabled={update.isPending || undefined}
          className={cn(
            buttonVariants({ variant: "glass", size: "sm" }),
            "cursor-pointer focus-within:ring-2 focus-within:ring-ring/25 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          )}
        >
          <HugeiconsIcon icon={Camera01Icon} size={16} strokeWidth={1.6} />
          {user.image ? t("settings.profile.changePhoto") : t("settings.profile.uploadPhoto")}
          <input
            type="file"
            accept={AVATAR_ACCEPTED_TYPES.join(",")}
            disabled={update.isPending}
            onChange={pick}
            className="sr-only"
          />
        </label>
        {user.image && (
          <ConfirmPopover
            open={confirmingRemove}
            onOpenChange={setConfirmingRemove}
            title={t("settings.profile.removePhotoTitle")}
            description={t("settings.profile.removePhotoDescription")}
            confirmLabel={t("settings.profile.remove")}
            onConfirm={remove}
            align="start"
            trigger={
              <Button variant="ghost" size="sm" disabled={update.isPending}>
                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.6} />
                {t("settings.profile.remove")}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
