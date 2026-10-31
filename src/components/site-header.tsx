import Link from "next/link";
import { Logo } from "@/components/logo";
import { InstallButton } from "@/components/pwa/install-button";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-wrap site-header__inner">
        <Logo />
        <nav aria-label="Primary" className="site-nav">
          <Link href="/">Institution</Link>
          <Link href="/events">Events</Link>
        </nav>
        <div className="site-actions">
          <InstallButton />
          <Link href="/login" className="text-link">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
