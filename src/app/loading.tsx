export default function Loading() {
  return (
    <div className="page-wrap py-16" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--border)]" />
      <div className="mt-5 h-10 w-2/3 max-w-xl animate-pulse rounded-xl bg-[var(--border)]" />
      <div className="mt-3 h-4 w-1/2 max-w-md animate-pulse rounded bg-[var(--border)]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-36 animate-pulse rounded-2xl border border-[var(--border)] bg-white/60" />
        ))}
      </div>
    </div>
  );
}
