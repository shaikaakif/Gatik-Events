import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function SearchInput({
  className,
  placeholder,
  ...props
}: {
  className?: string;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">) {
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
      />
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          "pl-10 flex h-11 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-tangerine)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}
