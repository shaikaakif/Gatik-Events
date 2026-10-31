"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  trigger,
  title,
  description,
  children,
  wide = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#142033]/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-6",
            wide ? "max-w-2xl" : "max-w-lg",
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-5">
            <div>
              <Dialog.Title className="text-xl font-extrabold tracking-[-0.02em]">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
