import { EventWorkspaceHeader } from "@/components/event-workspace-header";
import { WorkspaceNav } from "@/components/workspace-nav";
import type { EventRole } from "@/lib/types";

export function WorkspaceFrame({
  event,
  roles,
  activeRole,
  viewerName,
  children,
}: {
  event: {
    slug: string;
    title: string;
    starts_on: string;
    ends_on: string;
    timezone: string;
    venue_name: string;
    status: string;
  };
  roles: EventRole[];
  activeRole: EventRole;
  viewerName: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <EventWorkspaceHeader event={event} roles={roles} activeRole={activeRole} />
      <WorkspaceNav eventSlug={event.slug} role={activeRole} viewerName={viewerName} />
      {children}
    </>
  );
}
