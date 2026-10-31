"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-5">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <Field label="Email address" htmlFor="email" error={state.fieldErrors?.email?.[0]}>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingLabel="Sending…">Send reset link</SubmitButton>
      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Remembered it? <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
