import { DatabaseZap } from "lucide-react";
import { Alert } from "@/components/ui/alert";

export function SetupNotice({ feature = "This feature" }: { feature?: string }) {
  return (
    <Alert variant="warning" title="Configuration required">
      {feature} needs a Supabase project. Add `NEXT_PUBLIC_SUPABASE_URL` and
      `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then run the SQL migrations and seed script.
      No credentials are bundled or invented.
    </Alert>
  );
}

export function SetupState({ feature = "Account services" }: { feature?: string }) {
  return (
    <div className="space-y-6">
      <SetupNotice feature={feature} />
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <DatabaseZap aria-hidden="true" className="h-6 w-6 text-[var(--event-violet)]" />
        <h2 className="mt-4 text-lg font-extrabold">The interface is ready. The database is not connected.</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          This is an honest setup state, not a mock dashboard. Once the environment is configured, this
          route will use the real Supabase session, memberships, and event data.
        </p>
        <p className="mt-4 text-xs font-semibold text-[var(--muted-foreground)]">
          Setup commands and the required schema are documented in <code>README.md</code> and{" "}
          <code>supabase/migrations/</code>.
        </p>
      </div>
    </div>
  );
}
