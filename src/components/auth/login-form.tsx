"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-6">
      {state.status === "error" ? (
        <Alert variant="danger" className="rounded-lg">
          {state.message}
        </Alert>
      ) : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email address" htmlFor="email" error={state.fieldErrors?.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password" htmlFor="password" error={state.fieldErrors?.password?.[0]}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="flex items-end justify-between gap-2">
        <Link href="/forgot-password" className="text-xs font-bold text-[var(--brand-tangerine)] hover:underline">
          Forgot password?
        </Link>
      </div>
      <SubmitButton className="w-full" size="lg" variant="navy" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        New to G Events?{" "}
        <Link href="/signup" className="font-bold text-[var(--brand-navy)] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
