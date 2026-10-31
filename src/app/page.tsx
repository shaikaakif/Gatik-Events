import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="institution-page">
      <div className="institution-aurora" aria-hidden="true">
        <span className="aurora-field aurora-field--coral" />
        <span className="aurora-field aurora-field--sage" />
        <span className="aurora-field aurora-field--mustard" />
      </div>
      <div className="paper-grain" aria-hidden="true" />

      <header className="page-wrap institution-masthead">
        <Link href="/" className="institution-name" aria-label="G Group of Institutions home">
          G Group of<br />Institutions
        </Link>
        <p className="institution-meta">Institutional activities · Telangana</p>
      </header>

      <main id="main-content" className="page-wrap institution-main">
        <section className="institution-copy" aria-labelledby="institution-title">
          <p className="institution-kicker">Purpose, people, participation</p>
          <h1 id="institution-title" className="institution-title">
            Education.
            <em>With purpose.</em>
          </h1>
        </section>

        <div className="institution-lower">
          <div>
            <p className="institution-intro">
              A considered digital doorway to the moments that bring our campus community together.
            </p>
            <Link href="/events" className="institution-cta mt-7">
              Explore G Events
              <span aria-hidden="true"><ArrowRight /></span>
            </Link>
          </div>
          <p className="institution-footnote">
            <span>Gatik Events</span>
            <span>Every campus moment, coordinated.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
