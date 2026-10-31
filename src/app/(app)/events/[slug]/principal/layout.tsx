import type { Metadata } from "next";
import { requireRole } from "@/lib/events/guards";
import { WorkspaceFrame } from "@/components/workspace-frame";

export const metadata: Metadata = { title: "Principal workspace" };

export default async function PrincipalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { viewer, event, roles } = await requireRole(slug, "principal");
  return (
    <WorkspaceFrame
      event={event}
      roles={roles}
      activeRole="principal"
      viewerName={viewer.profile?.full_name ?? "Principal"}
    >
      {children}
    </WorkspaceFrame>
  );
}
