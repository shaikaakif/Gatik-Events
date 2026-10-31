"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error", { digest: error.digest });
  }, [error.digest]);

  return (
    <main id="main-content" className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="eyebrow justify-center before:hidden">Unexpected stop</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em]">Something interrupted this page.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          No data was silently accepted. Retry the page. If the problem continues, share the reference below with the event team.
        </p>
        {error.digest ? <p className="mt-4 font-mono text-[0.65rem] text-[var(--muted-foreground)]">Reference: {error.digest}</p> : null}
        <button
          type="button"
          className="mt-7 min-h-12 border-2 border-[var(--ink)] bg-[var(--coral)] px-5 text-sm font-extrabold shadow-[4px_4px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          onClick={reset}
        >
          Retry page
        </button>
      </div>
    </main>
  );
}
