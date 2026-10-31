"use client";

import { useActionState } from "react";
import { createRoomAction, updateRoomAction } from "@/lib/principal/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/submit-button";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type RoomValues = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  team_capacity: number;
  sort_order: number;
};

function RoomFields({
  state,
  room,
}: {
  state: ReturnType<typeof useActionState<typeof EMPTY_ACTION_STATE, FormData>>[0];
  room?: RoomValues;
}) {
  return (
    <>
      {state.status === "error" ? <Alert variant="danger">{state.message}</Alert> : null}
      {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Room name" htmlFor={`room-name-${room?.id ?? "new"}`} error={state.fieldErrors?.name?.[0]}>
          <Input id={`room-name-${room?.id ?? "new"}`} name="name" defaultValue={room?.name} required maxLength={80} placeholder="e.g. Room 01" />
        </Field>
        <Field label="Code" htmlFor={`room-code-${room?.id ?? "new"}`} error={state.fieldErrors?.code?.[0]}>
          <Input id={`room-code-${room?.id ?? "new"}`} name="code" defaultValue={room?.code} required maxLength={20} placeholder="R01" />
        </Field>
      </div>
      <Field label="Location" htmlFor={`room-location-${room?.id ?? "new"}`} hint="Optional" error={state.fieldErrors?.location?.[0]}>
        <Input id={`room-location-${room?.id ?? "new"}`} name="location" defaultValue={room?.location ?? ""} maxLength={120} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Team capacity" htmlFor={`room-capacity-${room?.id ?? "new"}`} error={state.fieldErrors?.team_capacity?.[0]}>
          <Input id={`room-capacity-${room?.id ?? "new"}`} name="team_capacity" type="number" min={1} max={20} defaultValue={room?.team_capacity ?? 2} required />
        </Field>
        <Field label="Sort order" htmlFor={`room-sort-${room?.id ?? "new"}`} error={state.fieldErrors?.sort_order?.[0]}>
          <Input id={`room-sort-${room?.id ?? "new"}`} name="sort_order" type="number" min={0} max={999} defaultValue={room?.sort_order ?? 0} required />
        </Field>
      </div>
    </>
  );
}

export function CreateRoomForm({ slug, eventId, nextSortOrder }: { slug: string; eventId: string; nextSortOrder: number }) {
  const [state, action] = useActionState(createRoomAction, EMPTY_ACTION_STATE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="event_id" value={eventId} />
      <RoomFields state={state} room={{ id: "", name: "", code: "", location: null, team_capacity: 2, sort_order: nextSortOrder }} />
      <SubmitButton pendingLabel="Creating room…">Create room</SubmitButton>
    </form>
  );
}

export function EditRoomForm({ slug, eventId, room }: { slug: string; eventId: string; room: RoomValues }) {
  const [state, action] = useActionState(updateRoomAction, EMPTY_ACTION_STATE);
  return (
    <Modal
      trigger={<Button type="button" variant="secondary" size="sm">Edit room</Button>}
      title={`Edit ${room.name}`}
      description="Room identity, location, and team capacity. The room status is reported by the assigned volunteer."
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="room_id" value={room.id} />
        <RoomFields state={state} room={room} />
        <SubmitButton pendingLabel="Saving room…">Save room</SubmitButton>
      </form>
    </Modal>
  );
}
