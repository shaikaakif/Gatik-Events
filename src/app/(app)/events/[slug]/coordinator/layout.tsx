import type { Metadata } from "next";
import { requireRole } from "@/lib/events/guards";
import { WorkspaceFrame } from "@/components/workspace-frame";

export const metadata: Metadata = { title: "Coordinator workspace" };

export default async function CoordinatorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { viewer, event, roles } = await requireRole(slug, "coordinator");
  return (
    <WorkspaceFrame
      event={event}
      roles={roles}
      activeRole="coordinator"
      viewerName={viewer.profile?.full_name ?? "Coordinator"}
    >
      {children}
    </WorkspaceFrame>
  );
}
