"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import {
  recordUnresolvedCheckInAction,
  recordVerifiedCheckInAction,
  updateRoomStatusAction,
} from "@/lib/volunteer/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";

export function VerifiedCheckInButton({
  slug,
  eventId,
  roomId,
  registrationId,
  alreadyVerified,
}: {
  slug: string;
  eventId: string;
  roomId: string;
  registrationId: string;
  alreadyVerified: boolean;
}) {
  const [state, action] = useActionState(recordVerifiedCheckInAction, EMPTY_ACTION_STATE);
  if (alreadyVerified) {
    return <Badge variant="success"><CheckCircle2 aria-hidden="true" className="h-3 w-3" /> Verified</Badge>;
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="room_id" value={roomId} />
        <input type="hidden" name="registration_id" value={registrationId} />
        <SubmitButton size="sm" pendingLabel="Recording…">Verify check-in</SubmitButton>
      </form>
      {state.status === "error" ? <span role="alert" className="max-w-56 text-right text-[0.65rem] font-semibold text-[var(--danger)]">{state.message}</span> : null}
      {state.status === "success" ? <span role="status" className="max-w-56 text-right text-[0.65rem] font-semibold text-[var(--success)]">{state.message}</span> : null}
    </div>
  );
}

export function UnresolvedCheckInForm({ slug, eventId, roomId }: { slug: string; eventId: string; roomId: string }) {
  const [state, action] = useActionState(recordUnresolvedCheckInAction, EMPTY_ACTION_STATE);
  return (
    <details className="rounded-2xl border border-[var(--border)] bg-white">
      <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-extrabold">
        <ShieldAlert aria-hidden="true" className="h-4 w-4 text-[var(--warning)]" />
        Record an unregistered or ambiguous attempt
      </summary>
      <form action={action} className="space-y-4 border-t border-[var(--border)] p-4">
        {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
        {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="room_id" value={roomId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome" htmlFor="unresolved-status" error={state.fieldErrors?.status?.[0]}>
            <Select id="unresolved-status" name="status" defaultValue="unregistered">
              <option value="unregistered">Unregistered</option>
              <option value="ambiguous">Ambiguous identity</option>
              <option value="flagged">Flagged for review</option>
            </Select>
          </Field>
          <Field label="Name stated" htmlFor="unresolved-name" error={state.fieldErrors?.name?.[0]}>
            <Input id="unresolved-name" name="name" required maxLength={120} />
          </Field>
          <Field label="Email stated" htmlFor="unresolved-email" hint="Optional" error={state.fieldErrors?.email?.[0]}>
            <Input id="unresolved-email" name="email" type="email" maxLength={254} />
          </Field>
          <Field label="Phone stated" htmlFor="unresolved-phone" hint="Optional" error={state.fieldErrors?.phone?.[0]}>
            <Input id="unresolved-phone" name="phone" type="tel" maxLength={24} />
          </Field>
        </div>
        <Field label="Volunteer note" htmlFor="unresolved-notes" hint="Optional" error={state.fieldErrors?.notes?.[0]}>
          <Textarea id="unresolved-notes" name="notes" maxLength={500} placeholder="What was observed at the desk?" />
        </Field>
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          This creates an audit record only. It does not create a registration, membership, or verified attendance.
        </p>
        <SubmitButton variant="secondary" pendingLabel="Recording…">Record unresolved attempt</SubmitButton>
      </form>
    </details>
  );
}

export function RoomStatusForm({
  slug,
  roomId,
  status,
  note,
}: {
  slug: string;
  roomId: string;
  status: string;
  note: string | null;
}) {
  const [state, action] = useActionState(updateRoomStatusAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="room_id" value={roomId} />
      <Field label="Room status" htmlFor="room-status">
        <Select id="room-status" name="status" defaultValue={status}>
          <option value="setup">Setup</option>
          <option value="active">Active</option>
          <option value="full">Full</option>
          <option value="closed">Closed</option>
          <option value="issue">Issue</option>
        </Select>
      </Field>
      <Field label="Status note" htmlFor="room-status-note" hint="Optional">
        <Textarea id="room-status-note" name="status_note" defaultValue={note ?? ""} maxLength={300} />
      </Field>
      <SubmitButton variant="secondary" size="sm" pendingLabel="Updating…">Update room status</SubmitButton>
    </form>
  );
}
