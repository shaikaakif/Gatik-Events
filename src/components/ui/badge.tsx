import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        navy: "border-[#193B63]/15 bg-[#eaf0f8] text-[#122d4b]",
        tangerine: "border-[#F07835]/20 bg-[#ffe8d9] text-[#b7471a]",
        ghost: "border-transparent bg-transparent text-[var(--muted-foreground)]",
        success:
          "border-[#25845A]/20 bg-[var(--success-surface)] text-[var(--success)]",
        warning:
          "border-[#B7791F]/20 bg-[var(--warning-surface)] text-[var(--warning)]",
        danger: "border-[#C74747]/20 bg-[var(--danger-surface)] text-[var(--danger)]",
        surface: "border-[var(--border)] bg-white text-[var(--foreground)]",
        muted: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted-foreground)]",
        // Backward-compatible aliases
        violet: "border-[#8152d8]/15 bg-[var(--surface-lavender)] text-[#5a3dab]",
        neutral: "border-[var(--border)] bg-white text-[var(--foreground)]",
        orange: "border-[#F07835]/20 bg-[#ffe8d9] text-[#b7471a]",
        lime: "border-[#5c8e2e]/15 bg-[#f0f8e7] text-[#41661f]",
      },
    },
    defaultVariants: { variant: "surface" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
