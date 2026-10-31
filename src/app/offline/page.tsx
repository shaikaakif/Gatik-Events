import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center"><Logo /></div>
        <span className="mx-auto mt-12 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface-peach)] text-[var(--gatik-orange-ink)]">
          <WifiOff aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.045em]">You are offline.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Event operations need a live connection. This offline page is deliberately empty of participant,
          check-in, or administrative data. Reconnect and retry your action.
        </p>
        <Button asChild className="mt-7">
          <Link href="/events">Try again</Link>
        </Button>
        <p className="mt-5 text-xs text-[var(--muted-foreground)]">
          No attendance record is queued while offline.
        </p>
      </div>
    </main>
  );
}
