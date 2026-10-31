import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events/guards";
import { getMembershipRoles, requireViewer } from "@/lib/auth/guards";
import { WorkspaceFrame } from "@/components/workspace-frame";
import { isSupabaseConfigured } from "@/lib/env";

export default async function ParticipantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured()) return <>{children}</>;

  const { slug } = await params;
  const viewer = await requireViewer(`/events/${slug}/participant`);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const roles = await getMembershipRoles(event.id);
  if (!roles.includes("participant")) {
    // Registration must remain reachable before a membership exists. Every
    // other participant route revalidates the participant role itself.
    return <>{children}</>;
  }

  return (
    <WorkspaceFrame
      event={event}
      roles={roles}
      activeRole="participant"
      viewerName={viewer.profile?.full_name ?? "Participant"}
    >
      {children}
    </WorkspaceFrame>
  );
}
