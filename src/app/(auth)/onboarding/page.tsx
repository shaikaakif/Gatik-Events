import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, ShieldCheck, UserRound } from "lucide-react";
import { getViewer, requireViewer } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { ProfileForm } from "@/components/auth/profile-form";
import { SetupState } from "@/components/setup-notice";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your profile" };

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-3xl font-extrabold tracking-[-0.045em]">Set up your profile</h1>
        <div className="mt-7"><SetupState feature="Profiles" /></div>
      </div>
    );
  }

  const viewer = await requireViewer("/onboarding");
  const current = await getViewer();
  if (!current) redirect("/login");
  const profile = current.profile ?? {
    id: viewer.id,
    full_name: "",
    phone: null,
    avatar_url: null,
  };

  return (
    <div>
      <p className="eyebrow mb-3">Your identity</p>
      <h1 className="text-3xl font-extrabold tracking-[-0.045em]">Make your account useful.</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
        Your name and contact number help volunteers and coordinators identify you during the event. Keep the data minimal and accurate.
      </p>
      <div className="mt-7 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white p-4">
        <Avatar name={profile.full_name} url={profile.avatar_url} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{profile.full_name || "Complete your name"}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{current.email}</p>
        </div>
        <BadgeLike icon={<ShieldCheck className="h-3 w-3" />} label="Verified identity" />
      </div>
      <div className="mt-7">
        <ProfileForm profile={profile} />
      </div>
      <div className="mt-7 grid gap-2 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
        <Button asChild variant="secondary">
          <Link href="/events"><CalendarDays aria-hidden="true" className="h-4 w-4" /> Browse events</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/profile"><UserRound aria-hidden="true" className="h-4 w-4" /> Profile settings</Link>
        </Button>
      </div>
      <Link href="/events" className="mt-5 flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--primary-accent)] hover:underline">
        Continue to event directory <ArrowRight aria-hidden="true" className="h-3 w-3" />
      </Link>
    </div>
  );
}

function BadgeLike({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="ml-auto hidden items-center gap-1 rounded-full border border-[#2f6b3a]/15 bg-[var(--success-surface)] px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.1em] text-[var(--success)] sm:inline-flex">
      {icon}{label}
    </span>
  );
}
