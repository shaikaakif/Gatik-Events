import Link from "next/link";
import { ArrowLeft, ShieldCheck, Waypoints } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="relative hidden overflow-hidden bg-[var(--primary)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="route-mark absolute inset-0 opacity-70" />
        <div className="relative z-10">
          <Logo inverse />
        </div>
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-[#ffe8d9]">
            <Waypoints aria-hidden="true" className="h-3.5 w-3.5" /> G Events · Xplorer 2026
          </span>
          <h2 className="mt-6 font-display text-5xl leading-[0.96]">
            One event.
            <br />
            <span className="italic text-[#ffe8d9]">Every handoff covered.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
            Your account opens the events and roles you are authorized to use. No shared staff code, no client-side role trust.
          </p>
          <div className="mt-8 flex items-center gap-3 border-t border-white/12 pt-5 text-xs text-white/55">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#F07835]" />
             Custom sessions · verified email · event-scoped memberships
          </div>
        </div>
        <p className="relative z-10 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/35">
          Gatik Junior College · The Bodhi Tree Campus
        </p>
      </aside>

      <main id="main-content" className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="lg:hidden"><Logo /></div>
          <Link href="/" className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
