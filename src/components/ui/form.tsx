import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-tangerine)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex h-28 w-full resize-y rounded-xl border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-tangerine)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 py-2.5 pr-10 text-sm text-[var(--foreground)] shadow-sm transition appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-tangerine)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-foreground)]",
        "bg-[linear-gradient(45deg,transparent_50%,#5b6475_50%),linear-gradient(135deg,#5b6475_50%,transparent_50%)]",
        "bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%]",
        "bg-[size:5px_5px,5px_5px]",
        "bg-no-repeat",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, hint, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }) {
  return (
    <label className={cn("block text-sm font-extrabold text-[var(--foreground)] mb-1.5", className)} {...props}>
      {children}
      {hint ? <span className="ml-2 font-medium text-[var(--muted-foreground)]">{hint}</span> : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={htmlFor}>{label}</Label>
          {hint ? <span className="text-xs text-[var(--muted-foreground)]">{hint}</span> : null}
        </div>
      ) : hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs font-semibold text-[var(--danger)]" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
