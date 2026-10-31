import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-lavender)] text-[var(--event-violet-strong)]">
          <Compass aria-hidden="true" className="h-7 w-7" />
        </span>
        <p className="eyebrow mt-6 justify-center before:hidden">404 · Off the route</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">This page is not on the map.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          The event or page may have moved, or your account may not have access to this part of the workspace.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild><Link href="/events">Back to events</Link></Button>
          <Button asChild variant="secondary"><Link href="/">Home</Link></Button>
        </div>
      </div>
    </main>
  );
}
