import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  info: { icon: Info, className: "border-[#28558b]/15 bg-[var(--info-surface)] text-[#193e69]" },
  success: { icon: CheckCircle2, className: "border-[#2f6b3a]/15 bg-[var(--success-surface)] text-[#24552e]" },
  warning: { icon: TriangleAlert, className: "border-[#8a5a00]/15 bg-[var(--warning-surface)] text-[#6d4700]" },
  danger: { icon: AlertCircle, className: "border-[#b42318]/15 bg-[var(--danger-surface)] text-[#8f1d14]" },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: tone } = variants[variant];
  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", tone, className)}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title ? <p className="font-extrabold">{title}</p> : null}
        <div className={cn(title && "mt-0.5", "leading-relaxed")}>{children}</div>
      </div>
    </div>
  );
}
