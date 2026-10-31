"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      <Field label="New password" htmlFor="password" hint="12+ characters" error={state.fieldErrors?.password?.[0]}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm_password" error={state.fieldErrors?.confirm_password?.[0]}>
        <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
