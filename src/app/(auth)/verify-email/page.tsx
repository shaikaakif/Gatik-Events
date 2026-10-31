import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { SetupNotice } from "@/components/setup-notice";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--surface-lavender)] text-[var(--event-violet-strong)]">
        <MailCheck aria-hidden="true" className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.045em]">Check your inbox</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
        We sent a verification link{email ? <> to <strong className="text-[var(--foreground)]">{email}</strong></> : null}.
        Open it on this device to verify your email and continue to your profile.
      </p>
      <div className="mt-7 space-y-3">
        {!isSupabaseConfigured() ? <SetupNotice feature="Email verification" /> : null}
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
          The single-use link expires after 24 hours. If it has expired, request a fresh one below.
        </div>
        <ResendVerificationForm email={email} />
      </div>
    </div>
  );
}
