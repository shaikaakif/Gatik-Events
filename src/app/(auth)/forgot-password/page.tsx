import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SetupNotice } from "@/components/setup-notice";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="eyebrow mb-3">Account recovery</p>
      <h1 className="text-3xl font-extrabold tracking-[-0.045em]">Reset your password</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Enter your account email. If it exists, we will send a single-use reset link.
      </p>
      <div className="mt-7">
        {!isSupabaseConfigured() ? <div className="mb-5"><SetupNotice feature="Password reset" /></div> : null}
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
