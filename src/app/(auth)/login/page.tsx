import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "@/components/auth/login-form";
import { SetupNotice } from "@/components/setup-notice";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const params = await searchParams;
  return (
    <div className="max-w-sm">
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.05em]">Sign in to G Events</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Use the individual account issued for your event role.
      </p>
      <div className="mt-9">
        {!isSupabaseConfigured() ? <div className="mb-6"><SetupNotice feature="Sign in" /></div> : null}
        {params.denied ? (
          <p className="mb-6 rounded-lg border border-[#B7791F]/20 bg-[var(--warning-surface)] p-3 text-sm font-semibold text-[#B7791F]">
            Your account does not have access to that workspace.
          </p>
        ) : null}
        <LoginForm next={safeNextPath(params.next)} />
      </div>
    </div>
  );
}
