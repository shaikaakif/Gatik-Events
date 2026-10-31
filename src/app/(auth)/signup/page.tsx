import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { SignUpForm } from "@/components/auth/signup-form";
import { SetupNotice } from "@/components/setup-notice";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="max-w-sm">
      <p className="eyebrow mb-3">New account</p>
      <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.05em]">Create your account</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Register once, then choose the event roles already granted to you.
      </p>
      <div className="mt-9">
        {!isSupabaseConfigured() ? (
          <div className="mb-6"><SetupNotice feature="Account creation" /></div>
        ) : null}
        <SignUpForm />
      </div>
    </div>
  );
}
