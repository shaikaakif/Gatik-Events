"use client";

import { useActionState } from "react";
import {
  createTeamAction,
  inviteTeamMemberAction,
  leaveTeamAction,
  removeTeamMemberAction,
  revokeInvitationAction,
  transferLeadershipAction,
  updateTeamDetailsAction,
} from "@/lib/teams/actions";
import { EMPTY_ACTION_STATE, type ActionState } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";

type SchoolOption = { id: string; name: string; city: string | null };

export function CreateTeamForm({
  eventId,
  slug,
  schools,
  defaultSchoolId,
}: {
  eventId: string;
  slug: string;
  schools: SchoolOption[];
  defaultSchoolId?: string;
}) {
  const [state, action] = useActionState(createTeamAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-5">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <Field label="Team name" htmlFor="team-name" error={state.fieldErrors?.name?.[0]}>
        <Input id="team-name" name="name" required minLength={2} maxLength={60} placeholder="e.g. The Cartographers" />
      </Field>
      <Field label="School" htmlFor="team-school" error={state.fieldErrors?.school_id?.[0]}>
        <Select id="team-school" name="school_id" required defaultValue={defaultSchoolId ?? ""}>
          <option value="" disabled>Select your school</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}{school.city ? ` — ${school.city}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Team description" htmlFor="team-description" hint="Optional" error={state.fieldErrors?.description?.[0]}>
        <Textarea id="team-description" name="description" maxLength={500} placeholder="A line about how your team works." />
      </Field>
      <SubmitButton pendingLabel="Creating team…">Create team and become leader</SubmitButton>
    </form>
  );
}

export function InviteTeammateForm({ slug, teamId }: { slug: string; teamId: string }) {
  const [state, action] = useActionState(inviteTeamMemberAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="team_id" value={teamId} />
      <Field label="Invite by email" htmlFor="invite-email" hint="Must already have a confirmed registration" error={state.fieldErrors?.email?.[0]}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="invite-email" name="email" type="email" required placeholder="teammate@example.com" />
          <SubmitButton variant="violet" className="shrink-0" pendingLabel="Inviting…">Send invitation</SubmitButton>
        </div>
      </Field>
    </form>
  );
}

export function TeamDetailsForm({
  slug,
  teamId,
  name,
  description,
  schools,
  defaultSchoolId,
}: {
  slug: string;
  teamId: string;
  name: string;
  description: string | null;
  schools: SchoolOption[];
  defaultSchoolId: string;
}) {
  const [state, action] = useActionState(updateTeamDetailsAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-4">
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="team_id" value={teamId} />
      <Field label="Team name" htmlFor="edit-team-name" error={state.fieldErrors?.name?.[0]}>
        <Input id="edit-team-name" name="name" defaultValue={name} required minLength={2} maxLength={60} />
      </Field>
      <Field label="School" htmlFor="edit-team-school" error={state.fieldErrors?.school_id?.[0]}>
        <Select id="edit-team-school" name="school_id" defaultValue={defaultSchoolId} required>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>{school.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Description" htmlFor="edit-team-description" hint="Optional" error={state.fieldErrors?.description?.[0]}>
        <Textarea id="edit-team-description" name="description" defaultValue={description ?? ""} maxLength={500} />
      </Field>
      <SubmitButton variant="secondary" pendingLabel="Saving…">Save team details</SubmitButton>
    </form>
  );
}

type ActionKind = "remove" | "leave" | "transfer" | "revoke";
const teamActions: Record<ActionKind, (state: ActionState, formData: FormData) => Promise<ActionState>> = {
  remove: removeTeamMemberAction,
  leave: leaveTeamAction,
  transfer: transferLeadershipAction,
  revoke: revokeInvitationAction,
};

export function TeamActionForm({
  kind,
  slug,
  teamId,
  userId,
  invitationId,
  label,
  pendingLabel,
  variant,
  confirmMessage,
}: {
  kind: ActionKind;
  slug: string;
  teamId: string;
  userId?: string;
  invitationId?: string;
  label: string;
  pendingLabel: string;
  variant?: "secondary" | "outline" | "ghost" | "danger";
  confirmMessage?: string;
}) {
  const [state, action] = useActionState(teamActions[kind], EMPTY_ACTION_STATE);
  return (
    <form
      action={action}
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="team_id" value={teamId} />
      {userId ? <input type="hidden" name="user_id" value={userId} /> : null}
      {invitationId ? <input type="hidden" name="invitation_id" value={invitationId} /> : null}
      <SubmitButton variant={variant} size="sm" pendingLabel={pendingLabel}>{label}</SubmitButton>
      {state.status === "error" ? <span role="alert" className="max-w-52 text-[0.65rem] font-semibold text-[var(--danger)]">{state.message}</span> : null}
    </form>
  );
}
