import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  url,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-8 w-8 text-[0.65rem]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" };
  if (url) {
    // Arbitrary external images are intentionally avoided; only verified URLs render.
    return (
      <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]", sizes[size], className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-[#193e69]/10 bg-[#eaf0f8] font-extrabold tracking-wide text-[#193e69]",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
