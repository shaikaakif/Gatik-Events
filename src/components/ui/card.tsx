import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-[var(--border)] px-5 py-4 sm:px-6", className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-white/60 px-6 py-12 text-center", className)}>
      {icon ? (
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-muted)] text-[var(--brand-navy)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-extrabold tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="eyebrow mb-2">
            {eyebrow}
            <span className="ml-1.5 h-0.5 w-1.5 rounded-full bg-[var(--brand-tangerine)]" />
          </p>
        ) : null}
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--foreground)] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[var(--border)] bg-white/80 pb-7 pt-6 backdrop-blur-sm">
      <div className="page-wrap flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="eyebrow mb-2">
              {eyebrow}
              <span className="ml-1.5 h-0.5 w-1.5 rounded-full bg-[var(--brand-tangerine)]" />
            </p>
          ) : null}
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "navy" | "tangerine" | "ice" | "lavender" | "peach" | "violet" | "orange" | "lime";
}) {
  const tones = {
    navy: "bg-[#eaf0f8] text-[#122d4b]",
    tangerine: "bg-[#ffe8d9] text-[#b7471a]",
    ice: "bg-[#e8f1fa] text-[#193B63]",
    lavender: "bg-[var(--surface-lavender)] text-[#5a3dab]",
    peach: "bg-[var(--surface-peach)] text-[#a34e14]",
    violet: "border-[#8152d8]/15 bg-[var(--surface-lavender)] text-[#5a3dab]",
    orange: "border-[#a34e14]/15 bg-[var(--surface-peach)] text-[#a34e14]",
    lime: "border-[#5c8e2e]/15 bg-[#f0f8e7] text-[#41661f]",
  };
  return (
    <div className="surface-card p-5">
      <div className={cn("mb-4 inline-grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
        {String(value).slice(0, 2)}
      </div>
      <p className="text-3xl font-extrabold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{label}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p> : null}
    </div>
  );
}
