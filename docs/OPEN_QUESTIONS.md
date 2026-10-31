# Historical Open Questions and Decisions

> **HISTORICAL:** Superseded by the owner-confirmed master blueprint and `docs/DECISION_LOG.md`.

**Status:** Planning only. These items are not resolved in code.
**Purpose:** Make missing information and assumptions explicit so implementation does not silently invent business rules.
**Related:** [Product spec](PRODUCT_SPEC.md) · [RBAC matrix](RBAC_PERMISSION_MATRIX.md) · [Security plan](SECURITY_PLAN.md) · [Demo plan](DEMO_PLAN.md)

---

## 1. Blocking before implementation

| ID | Question | Why it matters | Default if not answered | Blocks |
|---|---|---|---|---|
| Q-01 | What is the official hackathon name, theme, and full challenge brief? | The workspace only contains the product spec and scoring weights; the brief itself is not present. Pitch framing and “problem understanding” depend on it. | Use the supplied product spec + Xplorer context; do not invent a hackathon name/theme. | Pitch/final narrative; not M0 |
| Q-02 | What is the exact full problem statement content (all six sections)? | The schema/page can be built, but the challenge must not be invented. Copy actions need real content. | Build the challenge page with an honest “not published” state; seed only after content arrives. | M5 / demo |
| Q-03 | Where are the Gatik/Xplorer logo, poster, and brand asset files, and what are the usage rights? | Needed for identity, PWA icons, event cards, and a non-generic UI. | Use a typographic “XPLORER 26 / CHAPTER 4” event mark and token colors; do not copy the dark poster. | M0 visual polish / M10 icons |
| Q-04 | Approve the subdomain. Is `events.shaikaakif.com` acceptable? | Auth redirects, Resend links, cookies, and deployment depend on one canonical origin. | `events.shaikaakif.com` (proposed, not configured). | M10/M11 |
| Q-05 | Who has BigRock DNS access, and who authorizes DNS changes? | Deployment cannot complete without it; exact records must come from Vercel/Resend. | No DNS changes during planning. | M11 |
| Q-06 | Which Resend sender/domain should be used (e.g., `noreply@shaikaakif.com`), and is the domain verified? | Auth verification/reset and invitations depend on deliverability. | Use a verified address on `shaikaakif.com`; retrieve DNS records from Resend at deployment. | M1/M4 email |
| Q-07 | What is the institution’s policy for participants who are minors (guardian consent, data retention, photos)? | The platform stores names, phone/email, school, and attendance; safeguarding is a real obligation. | Do not collect real minor data until approved; demo uses synthetic data. | Real launch; demo can proceed |
| Q-08 | Is the requested shared “staff dashboard password” mandatory? | It conflicts with per-account authorization and can create false security. | Do **not** implement a shared access code; use per-account credentials + memberships. If required, make it a demo-only, non-authorization gate. | M11 demo access |

---

## 2. Product and business decisions

| ID | Question | Impact | Default assumption |
|---|---|---|---|
| Q-09 | Must all team members be from the same school as the team? | Registration validation and invitation rules | No DB constraint; team has a representing school; members may be from any registered school. Confirm. |
| Q-10 | Can participants add a missing school, or must the principal create it? | Registration friction vs data quality | Principal-managed school list for MVP; participant selects an existing school. |
| Q-11 | Who may create a new event? Any event principal, or an institution-level administrator? | Security/governance; multi-campus correctness | Any active principal may create an event and becomes its principal (single-institution MVP). |
| Q-12 | Do coordinators default to all rooms or require explicit assignment? | Least privilege vs setup friction | Explicit assignments; `room_id = null` means all rooms, seeded for the all-room coordinator. |
| Q-13 | Is check-in once per event or once per day/room? | Duplicate rules and schema index | Once per participant per event (arrival check-in). |
| Q-14 | Can a principal override/correct a volunteer’s check-in? | Operational recovery vs chain of custody | No silent edit; flagged/correction flow is future. Principal can view/audit. |
| Q-15 | Team leadership: can the leader remove members, transfer leadership, or disband? | UI/dialog rules and RPCs | Leader can remove members before lock, must transfer before leaving, one-person forming team can disband. Confirm. |
| Q-16 | What happens when event capacity/team cap is reached? | Registration UX and data state | Reject with clear message; waitlist is future unless approved. |
| Q-17 | Should the 12-team Xplorer configuration be a hard cap or just seed data? | Live demo team creation | Treat as `max_teams=12`; leave one open slot for the demo (see Demo Plan). |
| Q-18 | Is email delivery for team invitations required in the MVP, or is in-app enough? | Resend scope/complexity | In-app invitations are required; email is included if domain verification is ready. |
| Q-19 | Do we need a public event landing page (pre-auth) or auth-first only? | Marketing/discovery scope | Minimal public landing with sign-in; directory remains authenticated. |
| Q-20 | Is dark mode required? | Design/QA scope | No; light-first only for MVP. |
| Q-21 | Which event metrics matter to the principal beyond counts (e.g., school participation, check-in rate)? | Dashboard design, queries | Registrations, confirmed participants, teams, schools, room utilization, staff coverage, check-in/exception counts. |
| Q-22 | Should announcements be manageable by coordinators or principals only? | Permissions | Principal-only in MVP; coordinators read. |
| Q-23 | Should volunteers be able to update room status for rooms they are not assigned to in an emergency? | Operational flexibility vs scope | No; principal can update any room. |
| Q-24 | Is a “waitlist” required for the demo? | Registration state/UI | No; reject when full. |

---

## 3. Technical and operational decisions

| ID | Question | Impact | Default assumption |
|---|---|---|---|
| Q-25 | Can Docker be installed for local Supabase, or should we use a hosted dev project? | RLS/local DB testing speed | Use hosted dev project; install Docker only with approval. |
| Q-26 | Which exact Next.js/React/Tailwind versions should be pinned? | Compatibility/build | Registry candidates: Next 16.4.3, React 19.3.1, Tailwind 4.3.3; verify at M0 and pin. |
| Q-27 | Is Vercel free tier sufficient for the demo (function limits, build minutes)? | Deployment reliability | Yes for demo scale; monitor limits; no heavy cron/realtime. |
| Q-28 | Do we need Sentry/analytics in the MVP? | Privacy/dependencies | No; Vercel/Supabase logs + audit only. |
| Q-29 | What is the production data retention/deletion policy? | Privacy/compliance | Retain until event archive + institution-defined period; not yet specified. |
| Q-30 | Should event posters/avatars be uploaded to Supabase Storage or referenced by URL? | Upload flow/security | Posters via Storage (principal only); avatars optional/initials fallback. |
| Q-31 | Are preview deployments allowed to use production Supabase? | Data safety | No; use dev/preview Supabase where possible. |
| Q-32 | Who owns rotating demo credentials and the private judge guide? | Demo security | Team lead; guide gitignored, rotated post-event. |
| Q-33 | Should the event seed status be `registration_open` while the event is live by date? | Demo registration/check-in | Yes for demo; display “Live” from dates; production transitions to `in_progress` when registration closes. |
| Q-34 | What is the official event end time on Nov 1? | Event window display | Use date-only `ends_on=2026-11-01`; do not invent a clock time. |
| Q-35 | Are there additional official schedule updates/venue details? | Schedule accuracy | Use only the supplied PDF; version changes if a new source arrives. |

---

## 4. Missing information (not yet provided)

- Official hackathon name, theme, full brief, and any track/category constraints beyond the scoring weights.
- Full Xplorer problem statement body (the six headings are known; the content is not).
- Gatik and Xplorer logo/poster source files and brand usage guidelines.
- Institution policy on minors, guardian consent, data retention, and photo usage.
- Exact production subdomain approval and DNS access owner.
- Resend sender identity/domain verification status.
- Final team rules (same-school requirement, removal/transfer, waitlist).
- Judge demo duration, venue, network, and device constraints.
- Whether any real accounts/data already exist (none found in the workspace).
- Whether the shared staff dashboard password is a hard requirement or an informal demo idea.

---

## 5. Approval checklist (before implementation)

Please explicitly approve or change:

- [ ] **Product scope:** the MVP in [PRODUCT_SPEC.md §17](PRODUCT_SPEC.md#17-mvp-scope), including what is out of scope.
- [ ] **Architecture:** Next.js App Router + Supabase Auth/Postgres/RLS + server actions + Resend; no separate API service.
- [ ] **Schema:** event-scoped memberships; merged/omitted tables (`participants`, `schedules`, `event_settings`, `user_preferences`); added `event_schools`, `coordinator_assignments`, `event_challenges`.
- [ ] **Authorization:** membership-only roles; volunteer room scope; coordinator assignment scope; RPC-only sensitive writes.
- [ ] **Event creation rule:** any principal may create an event and becomes its principal (single-institution MVP).
- [ ] **Team rules:** 2–5, one team per participant, invitation rules, leadership/removal policy.
- [ ] **Check-in rule:** one verified check-in per participant per event; volunteers only; principals view/audit.
- [ ] **Design direction:** light-first “Institutional Expedition”, Manrope + Instrument Serif, navy/orange + violet/lavender/lime.
- [ ] **Dependency choices:** shadcn/ui + Radix + Lucide + Zod; CSS-only motion; hand-written service worker; no chart/animation library.
- [ ] **Domain:** `events.shaikaakif.com` (or alternative).
- [ ] **Demo access:** per-account credentials (recommended) vs shared staff code.
- [ ] **Content/assets:** provide the full problem statement and brand assets, or approve the interim typographic mark/unpublished state.
- [ ] **Privacy:** confirm minor/guardian/retention policy before real participant data.
- [ ] **Start M0:** authorize repository/scaffold creation (no production DNS or deployment yet).

---

## 6. Decision log format

When a question is resolved, record:

```
Date:
Decision:
Rationale:
Owner:
Affects (milestone/doc):
```

Update this file and the relevant source-of-truth doc. Do not leave contradictory decisions in multiple documents.
