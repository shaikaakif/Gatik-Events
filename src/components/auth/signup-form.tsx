"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-6">
      {state.status === "error" ? (
        <Alert variant="danger" className="rounded-lg">
          {state.message}
        </Alert>
      ) : null}
      <Field label="Full name" htmlFor="full_name" error={state.fieldErrors?.full_name?.[0]}>
        <Input id="full_name" name="full_name" autoComplete="name" required placeholder="Your full name" />
      </Field>
      <Field label="Email address" htmlFor="email" error={state.fieldErrors?.email?.[0]}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Phone" htmlFor="phone" hint="Optional" error={state.fieldErrors?.phone?.[0]}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91" />
      </Field>
      <Field label="Password" htmlFor="password" hint="12+ characters" error={state.fieldErrors?.password?.[0]}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" variant="navy" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Already registered? <Link href="/login" className="font-bold text-[var(--brand-navy)] hover:underline">Sign in</Link>
      </p>
      <p className="text-center text-[0.68rem] leading-relaxed text-[var(--muted-foreground)]">
        By creating an account you agree to use this workspace only for authorized G Events activity.
      </p>
    </form>
  );
}
