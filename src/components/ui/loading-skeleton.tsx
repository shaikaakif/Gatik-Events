import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
  height = "1rem",
  width = "100%",
}: { className?: string; height?: string; width?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface-muted)]",
        className,
      )}
      style={{ height, width }}
    />
  );
}

export function SkeletonLine({
  className,
  width = "60%",
}: { className?: string; width?: string }) {
  return (
    <LoadingSkeleton className={className} height="0.875rem" width={width} />
  );
}

export function SkeletonCircle({ className, size = "3rem" }: { className?: string; size?: string }) {
  return (
    <LoadingSkeleton
      className={cn("shrink-0 rounded-full", className)}
      height={size}
      width={size}
    />
  );
}
