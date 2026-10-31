import type { Metadata } from "next";
import { requireRole } from "@/lib/events/guards";
import { WorkspaceFrame } from "@/components/workspace-frame";

export const metadata: Metadata = { title: "Volunteer workspace" };

export default async function VolunteerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { viewer, event, roles } = await requireRole(slug, "volunteer");
  return (
    <WorkspaceFrame
      event={event}
      roles={roles}
      activeRole="volunteer"
      viewerName={viewer.profile?.full_name ?? "Volunteer"}
    >
      {children}
    </WorkspaceFrame>
  );
}
