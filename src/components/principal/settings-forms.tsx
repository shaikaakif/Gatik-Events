"use client";

import { useActionState } from "react";
import { createEventAction, updateEventSettingsAction, updateEventStatusAction } from "@/lib/principal/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { EVENT_CATEGORIES, EVENT_STATUSES } from "@/lib/validation/principal";
import { eventStatusLabel } from "@/lib/events/utils";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

export function CreateEventForm() {
  const [state, action] = useActionState(createEventAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-6">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      <fieldset className="space-y-5">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Identity</legend>
        <Field label="Event title" htmlFor="new-title" error={state.fieldErrors?.title?.[0]}>
          <Input id="new-title" name="title" required minLength={3} maxLength={160} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="URL slug" htmlFor="new-slug" hint="lowercase-and-hyphens" error={state.fieldErrors?.slug?.[0]}>
            <Input id="new-slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={80} />
          </Field>
          <Field label="Category" htmlFor="new-category" error={state.fieldErrors?.category?.[0]}>
            <Select id="new-category" name="category" defaultValue="other">
              {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{eventStatusLabel(category)}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Description" htmlFor="new-description" hint="Optional" error={state.fieldErrors?.description?.[0]}>
          <Textarea id="new-description" name="description" maxLength={4000} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 border-t border-[var(--border)] pt-6">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Place and dates</legend>
        <Field label="Venue" htmlFor="new-venue" error={state.fieldErrors?.venue_name?.[0]}>
          <Input id="new-venue" name="venue_name" required minLength={2} maxLength={200} />
        </Field>
        <Field label="Venue address" htmlFor="new-address" hint="Optional" error={state.fieldErrors?.venue_address?.[0]}>
          <Input id="new-address" name="venue_address" maxLength={300} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Timezone" htmlFor="new-timezone" error={state.fieldErrors?.timezone?.[0]}>
            <Input id="new-timezone" name="timezone" defaultValue="Asia/Kolkata" required />
          </Field>
          <Field label="Starts on" htmlFor="new-start" error={state.fieldErrors?.starts_on?.[0]}>
            <Input id="new-start" name="starts_on" type="date" required />
          </Field>
          <Field label="Ends on" htmlFor="new-end" error={state.fieldErrors?.ends_on?.[0]}>
            <Input id="new-end" name="ends_on" type="date" required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-[var(--border)] pt-6">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Registration and teams</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Registration opens" htmlFor="new-opens" hint="Optional local time" error={state.fieldErrors?.registration_opens_at?.[0]}>
            <Input id="new-opens" name="registration_opens_at" type="datetime-local" />
          </Field>
          <Field label="Registration closes" htmlFor="new-closes" hint="Optional local time" error={state.fieldErrors?.registration_closes_at?.[0]}>
            <Input id="new-closes" name="registration_closes_at" type="datetime-local" />
          </Field>
          <Field label="Minimum team size" htmlFor="new-min" error={state.fieldErrors?.min_team_size?.[0]}>
            <Input id="new-min" name="min_team_size" type="number" min={1} max={20} defaultValue={1} required />
          </Field>
          <Field label="Maximum team size" htmlFor="new-max" error={state.fieldErrors?.max_team_size?.[0]}>
            <Input id="new-max" name="max_team_size" type="number" min={1} max={20} defaultValue={5} required />
          </Field>
          <Field label="Maximum teams" htmlFor="new-teams" hint="Optional" error={state.fieldErrors?.max_teams?.[0]}>
            <Input id="new-teams" name="max_teams" type="number" min={1} />
          </Field>
          <Field label="Participant capacity" htmlFor="new-capacity" hint="Optional" error={state.fieldErrors?.capacity?.[0]}>
            <Input id="new-capacity" name="capacity" type="number" min={1} />
          </Field>
        </div>
      </fieldset>
      <div className="border-t border-[var(--border)] pt-5">
        <SubmitButton pendingLabel="Creating draft…">Create draft event</SubmitButton>
      </div>
    </form>
  );
}

export type EventSettings = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  venue_name: string;
  venue_address: string | null;
  timezone: string;
  starts_on: string;
  ends_on: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  min_team_size: number;
  max_team_size: number;
  max_teams: number | null;
  capacity: number | null;
};

export function EventSettingsForm({
  slug,
  event,
  registrationOpensInput,
  registrationClosesInput,
}: {
  slug: string;
  event: EventSettings;
  registrationOpensInput: string;
  registrationClosesInput: string;
}) {
  const [state, action] = useActionState(updateEventSettingsAction, EMPTY_ACTION_STATE);

  return (
    <form action={action} className="space-y-6">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="event_id" value={event.id} />

      <fieldset className="space-y-5">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Identity</legend>
        <Field label="Event title" htmlFor="settings-title" error={state.fieldErrors?.title?.[0]}>
          <Input id="settings-title" name="title" defaultValue={event.title} required minLength={3} maxLength={160} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="settings-category" error={state.fieldErrors?.category?.[0]}>
            <Select id="settings-category" name="category" defaultValue={event.category}>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{eventStatusLabel(category)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Timezone" htmlFor="settings-timezone" hint="IANA name" error={state.fieldErrors?.timezone?.[0]}>
            <Input id="settings-timezone" name="timezone" defaultValue={event.timezone} required maxLength={64} />
          </Field>
        </div>
        <Field label="Description" htmlFor="settings-description" hint="Optional" error={state.fieldErrors?.description?.[0]}>
          <Textarea id="settings-description" name="description" defaultValue={event.description ?? ""} maxLength={4000} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 border-t border-[var(--border)] pt-6">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Place and dates</legend>
        <Field label="Venue" htmlFor="settings-venue" error={state.fieldErrors?.venue_name?.[0]}>
          <Input id="settings-venue" name="venue_name" defaultValue={event.venue_name} required minLength={2} maxLength={200} />
        </Field>
        <Field label="Venue address" htmlFor="settings-address" hint="Optional" error={state.fieldErrors?.venue_address?.[0]}>
          <Input id="settings-address" name="venue_address" defaultValue={event.venue_address ?? ""} maxLength={300} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts on" htmlFor="settings-starts" error={state.fieldErrors?.starts_on?.[0]}>
            <Input id="settings-starts" name="starts_on" type="date" defaultValue={event.starts_on} required />
          </Field>
          <Field label="Ends on" htmlFor="settings-ends" error={state.fieldErrors?.ends_on?.[0]}>
            <Input id="settings-ends" name="ends_on" type="date" defaultValue={event.ends_on} required />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-[var(--border)] pt-6">
        <legend className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Registration and teams</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Registration opens" htmlFor="settings-reg-opens" hint="Local event time" error={state.fieldErrors?.registration_opens_at?.[0]}>
            <Input id="settings-reg-opens" name="registration_opens_at" type="datetime-local" defaultValue={registrationOpensInput} />
          </Field>
          <Field label="Registration closes" htmlFor="settings-reg-closes" hint="Local event time" error={state.fieldErrors?.registration_closes_at?.[0]}>
            <Input id="settings-reg-closes" name="registration_closes_at" type="datetime-local" defaultValue={registrationClosesInput} />
          </Field>
          <Field label="Minimum team size" htmlFor="settings-min-team" error={state.fieldErrors?.min_team_size?.[0]}>
            <Input id="settings-min-team" name="min_team_size" type="number" min={1} max={20} defaultValue={event.min_team_size} required />
          </Field>
          <Field label="Maximum team size" htmlFor="settings-max-team" error={state.fieldErrors?.max_team_size?.[0]}>
            <Input id="settings-max-team" name="max_team_size" type="number" min={1} max={20} defaultValue={event.max_team_size} required />
          </Field>
          <Field label="Maximum teams" htmlFor="settings-max-teams" hint="Blank means no cap" error={state.fieldErrors?.max_teams?.[0]}>
            <Input id="settings-max-teams" name="max_teams" type="number" min={1} defaultValue={event.max_teams ?? ""} />
          </Field>
          <Field label="Participant capacity" htmlFor="settings-capacity" hint="Blank means no cap" error={state.fieldErrors?.capacity?.[0]}>
            <Input id="settings-capacity" name="capacity" type="number" min={1} defaultValue={event.capacity ?? ""} />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
        <SubmitButton pendingLabel="Saving settings…">Save event settings</SubmitButton>
        <p className="text-xs text-[var(--muted-foreground)]">Lifecycle status is changed separately and never through this form.</p>
      </div>
    </form>
  );
}

export function LifecycleForm({
  slug,
  eventId,
  currentStatus,
  nextStatuses,
}: {
  slug: string;
  eventId: string;
  currentStatus: string;
  nextStatuses: string[];
}) {
  const [state, action] = useActionState(updateEventStatusAction, EMPTY_ACTION_STATE);
  const options = nextStatuses.length > 0 ? nextStatuses : EVENT_STATUSES.filter((status) => status !== currentStatus);

  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="event_id" value={eventId} />
      <Field
        label="Next lifecycle state"
        htmlFor="next-status"
        hint={nextStatuses.length === 0 ? "This event is archived" : "Only valid transitions are listed"}
      >
        <Select id="next-status" name="next_status" disabled={nextStatuses.length === 0} defaultValue={options[0]}>
          {options.map((status) => (
            <option key={status} value={status}>{eventStatusLabel(status)}</option>
          ))}
        </Select>
      </Field>
      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
        Current state: <strong className="text-[var(--foreground)]">{eventStatusLabel(currentStatus)}</strong>. The database
        rejects transitions that skip required steps. Every change is audited.
      </p>
      <SubmitButton variant="secondary" size="sm" disabled={nextStatuses.length === 0} pendingLabel="Updating lifecycle…">
        Apply lifecycle change
      </SubmitButton>
    </form>
  );
}
