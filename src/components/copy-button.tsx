"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "secondary",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "violet";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" onClick={copy} variant={variant} size="sm" aria-live="polite">
      {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
