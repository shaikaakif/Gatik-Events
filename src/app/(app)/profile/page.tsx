import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireViewer } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/auth/profile-form";
import { PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireViewer("/profile");
  const profile = viewer.profile ?? {
    id: viewer.id,
    full_name: "",
    phone: null,
    avatar_url: null,
  };

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Profile settings"
        description="Keep the name and contact number that event staff use to identify you accurate and minimal."
        action={<Badge variant="success"><ShieldCheck aria-hidden="true" className="h-3 w-3" /> Verified email</Badge>}
      />
      <main id="main-content" className="page-wrap py-8 sm:py-10">
        <div className="narrow-wrap">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to events
          </Link>

          <section className="mt-5 surface-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] pb-5">
              <Avatar name={profile.full_name} url={profile.avatar_url} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold">{profile.full_name || "Complete your name"}</p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{viewer.email}</p>
              </div>
            </div>
            <div className="mt-5">
              <ProfileForm profile={profile} />
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="eyebrow mb-3">Account notes</p>
            <ul className="space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
              <li>Email verification is managed by Gatik Events custom authentication. Changing your email is intentionally not exposed in this MVP.</li>
              <li>Your profile is visible only to yourself and event staff or teammates with a legitimate scope.</li>
              <li>Staff roles are assigned by an event principal. Editing this profile never grants event permissions.</li>
            </ul>
            <div className="mt-4">
              <Button asChild variant="secondary" size="sm"><Link href="/events">Return to event directory</Link></Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
