import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import type { SoundName } from "@/lib/sound";
import { cn } from "@/lib/utils";

const cueOf = (cue: SoundName | false | undefined, variant: string | null | undefined) => {
  if (cue !== undefined) return cue || undefined;
  return variant === "ghost" || variant === "link" ? undefined : "tap";
};

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-[color,background-color,box-shadow,filter,scale] duration-200 ease-[cubic-bezier(0.2,0,0,1)] outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "button-solid",
        glass: "button-glass",
        destructive: "button-danger",
        ghost: "text-muted-foreground not-disabled:hover:bg-foreground/[0.06] not-disabled:hover:text-foreground",
        link: "text-foreground underline-offset-4 not-disabled:hover:underline",
      },
      size: {
        default: "h-9 px-3.5 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-5 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: ReactNode;
  slowText?: ReactNode;
  cue?: SoundName | false;
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  loadingText,
  slowText,
  cue,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      data-sound={cueOf(cue, variant)}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={loading || disabled}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "disabled:cursor-progress disabled:opacity-80 [&>svg:not([data-slot=button-spinner])]:hidden",
        className,
      )}
      {...props}
    >
      {loading && (
        <HugeiconsIcon
          icon={Loading03Icon}
          data-slot="button-spinner"
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {loading && loadingText ? (
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)] text-start [&>*]:truncate [&>*]:[grid-area:1/1]">
          <span aria-hidden className="invisible [&_svg]:hidden">
            {children}
          </span>
          <span className={slowText ? "button-label-now" : undefined}>{loadingText}</span>
          {slowText && <span className="button-label-slow">{slowText}</span>}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export { buttonVariants };
