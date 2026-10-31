"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/submit-button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton variant="ghost" size="sm" pendingLabel="Signing out…">
        <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
        Sign out
      </SubmitButton>
    </form>
  );
}
