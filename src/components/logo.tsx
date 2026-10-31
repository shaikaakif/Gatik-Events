import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  const mark = (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden border-2",
        inverse
          ? "border-white/25 bg-white/15"
          : "border-[var(--ink)] bg-white text-[var(--foreground)]",
      )}
    >
      <Image
        src="/icons/gatik.jpg"
        alt=""
        loading="eager"
        priority
        className="h-full w-full object-contain shrink-0"
        width={96}
        height={96}
      />
    </span>
  );

  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="Gatik Events home"
    >
      {mark}
      {!compact ? (
        <span className="leading-none">
          <span className={cn("block text-[1rem] font-extrabold tracking-[-0.025em]", inverse ? "text-white" : "text-[var(--foreground)]")}>
            Gatik Events
          </span>
          <span className={cn("mt-0.5 block text-[0.6rem] font-bold uppercase tracking-[0.14em]", inverse ? "text-white/60" : "text-[var(--muted-foreground)]")}>
            Every moment, coordinated
          </span>
        </span>
      ) : null}
    </Link>
  );
}
