"use client";

import { useActionState } from "react";
import { registerForEventAction } from "@/lib/events/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

type SchoolOption = { id: string; name: string; city: string | null };

export function ParticipantRegistrationForm({
  eventId,
  slug,
  schools,
}: {
  eventId: string;
  slug: string;
  schools: SchoolOption[];
}) {
  const [state, action] = useActionState(registerForEventAction, EMPTY_ACTION_STATE);

  return (
    <form action={action} className="space-y-5">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />

      <Field label="School" htmlFor="school_id" error={state.fieldErrors?.school_id?.[0]}>
        <Select id="school_id" name="school_id" required defaultValue="">
          <option value="" disabled>
            Select your school
          </option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
              {school.city ? ` — ${school.city}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Grade or year"
          htmlFor="grade_year"
          hint="e.g. Inter 1st year"
          error={state.fieldErrors?.grade_year?.[0]}
        >
          <Input id="grade_year" name="grade_year" required maxLength={40} />
        </Field>
        <Field label="Roll number" htmlFor="roll_number" hint="Optional" error={state.fieldErrors?.roll_number?.[0]}>
          <Input id="roll_number" name="roll_number" maxLength={40} />
        </Field>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
        Register with the minimum information needed to identify you during the event. Your school
        and grade are shared only with authorized event staff.
      </div>

      <SubmitButton size="lg" pendingLabel="Confirming registration…">
        Confirm event registration
      </SubmitButton>
    </form>
  );
}
