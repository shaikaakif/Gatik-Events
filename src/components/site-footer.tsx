import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/60 py-10">
      <div className="page-wrap flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-xs leading-relaxed text-[var(--muted-foreground)]">
            One place to run a campus event — from the first registration to the final check-in.
            Built for Gatik Junior College and designed to extend to the next event.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[var(--muted-foreground)]">
          <Link href="/events" className="hover:text-[var(--foreground)]">Events</Link>
          <Link href="/login" className="hover:text-[var(--foreground)]">Sign in</Link>
          <span>© {new Date().getFullYear()} G Events</span>
        </div>
      </div>
    </footer>
  );
}
