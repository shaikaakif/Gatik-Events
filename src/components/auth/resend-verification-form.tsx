"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";

export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendVerificationAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="email" value={email ?? ""} />
      <SubmitButton variant="secondary" className="w-full" pendingLabel="Requesting…">
        Resend verification link
      </SubmitButton>
    </form>
  );
}
