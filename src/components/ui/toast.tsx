"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

let toasts: Toast[] = [];
let listeners: Array<(t: Toast[]) => void> = [];

function emit() {
  for (const fn of listeners) fn(toasts);
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  const item: Toast = { id, title, description, variant };
  toasts = [item, ...toasts];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 5000);
  return id;
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);
  useEffect(() => {
    const unsubscribe = () => {
      listeners = listeners.filter((fn) => fn !== setState);
    };
    listeners.push(setState);
    emit();
    return unsubscribe;
  }, []);
  return { toasts: state, toast };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const variantStyles: Record<string, string> = {
  default: "border-[var(--border)] bg-white text-[var(--foreground)] shadow-md",
  destructive: "border-[var(--danger)]/20 bg-[var(--danger-surface)] text-[var(--danger)]",
  success: "border-[var(--success)]/20 bg-[var(--success-surface)] text-[var(--success)]",
};

export function ToastAction() {
  return null;
}

export function Toast({ toast }: { toast: Toast }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-right-4 duration-200",
        variantStyles[toast.variant as keyof typeof variantStyles],
      )}
    >
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60">
        <X aria-hidden="true" className="h-2.5 w-2.5 text-[var(--muted-foreground)]" />
      </div>
      <div className="space-y-1">
        {toast.title ? (
          <h4 className="text-sm font-bold text-[var(--foreground)]">{toast.title}</h4>
        ) : null}
        {toast.description ? (
          <p className="text-sm text-[var(--muted-foreground)]">{toast.description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  );
}
