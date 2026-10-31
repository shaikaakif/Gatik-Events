"use client";

import { useActionState } from "react";
import { acceptInvitationAction, declineInvitationAction } from "@/lib/teams/actions";
import { EMPTY_ACTION_STATE } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/submit-button";

export function InvitationActions({
  invitationId,
  token,
}: {
  invitationId: string;
  token?: string;
}) {
  const [acceptState, acceptFormAction] = useActionState(acceptInvitationAction, EMPTY_ACTION_STATE);
  const [declineState, declineFormAction] = useActionState(declineInvitationAction, EMPTY_ACTION_STATE);

  return (
    <div className="space-y-2">
      {acceptState.status === "error" ? <Alert variant="danger">{acceptState.message}</Alert> : null}
      {declineState.status === "error" ? <Alert variant="danger">{declineState.message}</Alert> : null}
      {declineState.status === "success" ? <Alert variant="info">{declineState.message}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <form action={acceptFormAction}>
          <input type="hidden" name="invitation_id" value={invitationId} />
          {token ? <input type="hidden" name="token" value={token} /> : null}
          <SubmitButton size="sm" pendingLabel="Joining…">Accept invitation</SubmitButton>
        </form>
        <form action={declineFormAction}>
          <input type="hidden" name="invitation_id" value={invitationId} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Declining…">Decline</SubmitButton>
        </form>
      </div>
    </div>
  );
}
