"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        navy:
          "border-transparent bg-[var(--brand-navy)] text-white shadow-[0_10px_24px_-12px_rgba(25,59,99,0.35)] hover:bg-[#122d4b] focus-visible:ring-[var(--brand-navy)]",
        tangerine:
          "border-transparent bg-[var(--brand-tangerine)] text-white shadow-[0_10px_24px_-12px_rgba(240,120,53,0.35)] hover:bg-[#d96125] focus-visible:ring-[var(--brand-tangerine)]",
        terracotta:
          "border-transparent bg-[var(--color-terracotta)] text-white shadow-[0_10px_24px_-12px_rgba(184,92,70,0.35)] hover:bg-[#a84a38] focus-visible:ring-[var(--focus-ring)]",
        ghost:
          "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:ring-[var(--focus-ring)]",
        outline:
          "border-[var(--border-strong)] bg-transparent text-[var(--foreground)] hover:bg-white hover:border-[var(--focus-ring)] focus-visible:ring-[var(--focus-ring)]",
        surface:
          "border-[var(--border)] bg-white text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--focus-ring)]",
        // Backward-compatible variants mapped to the V2 palette
        violet: "border-transparent bg-[#5a3dab] text-white shadow-[0_10px_24px_-12px_rgba(90,61,171,0.35)] hover:bg-[#4a359e] focus-visible:ring-[#5a3dab]",
        secondary: "border-[var(--border)] bg-white text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--focus-ring)]",
        danger: "border-[var(--danger)] bg-[var(--danger)] text-white shadow-[0_10px_24px_-12px_rgba(199,71,71,0.35)] hover:bg-[#8f1d14] focus-visible:ring-[var(--danger)]",
        // Legacy alias
        primary: "border-transparent bg-[var(--brand-navy)] text-white shadow-[0_10px_24px_-12px_rgba(25,59,99,0.35)] hover:bg-[#122d4b] focus-visible:ring-[var(--brand-navy)]",
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        md: "min-h-10 px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "navy", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
