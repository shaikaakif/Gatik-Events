"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  variant,
  size,
  className,
  disabled,
  formNoValidate,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "navy" | "tangerine" | "ghost" | "outline" | "surface" | "violet" | "secondary" | "danger" | "primary";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  formNoValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      formNoValidate={formNoValidate}
    >
      {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
