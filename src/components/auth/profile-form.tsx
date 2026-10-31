"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/auth/actions";
import { EMPTY_ACTION_STATE, type Profile } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfileAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-5">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <Field label="Full name" htmlFor="full_name" error={state.fieldErrors?.full_name?.[0]}>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
      </Field>
      <Field label="Phone" htmlFor="phone" hint="Optional" error={state.fieldErrors?.phone?.[0]}>
        <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
      </Field>
      <div className="flex items-center gap-3 pt-1">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
        <span className="text-xs text-[var(--muted-foreground)]">Email changes are managed through account support in the MVP.</span>
      </div>
    </form>
  );
}
