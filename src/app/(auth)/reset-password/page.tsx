import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div>
      <p className="eyebrow mb-3">Secure your account</p>
      <h1 className="font-display text-5xl leading-none">Choose a new password</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Use at least 12 characters. Completing this reset revokes all existing sessions.
      </p>
      <div className="mt-7"><ResetPasswordForm token={token} /></div>
    </div>
  );
}
