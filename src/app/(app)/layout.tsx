import { AppHeader } from "@/components/app-header";
import { SiteHeader } from "@/components/site-header";
import { getViewer } from "@/lib/auth/guards";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <div className="min-h-dvh">
      {viewer ? <AppHeader viewer={viewer} /> : <SiteHeader />}
      {children}
    </div>
  );
}
