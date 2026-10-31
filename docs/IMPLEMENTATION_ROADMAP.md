# Gatik Events — Implementation Roadmap

**Status:** Planning only. No milestone has started; no code exists.
**Source of truth for:** milestone sequence, scope, dependencies, acceptance criteria, security gates, test expectations, and risks.
**Related:** [Product spec](PRODUCT_SPEC.md) · [System architecture](SYSTEM_ARCHITECTURE.md) · [Database schema](DATABASE_SCHEMA.md) · [Security plan](SECURITY_PLAN.md) · [Test plan](TEST_PLAN.md) · [Demo plan](DEMO_PLAN.md)

---

## 1. Sequencing principles

1. **Vertical slices over isolated screens.** Each milestone ends with a usable end-to-end path, not a pile of unconnected components.
2. **Database truth early.** Auth, memberships, roles, and event scoping are established before role dashboards.
3. **Security is not a late phase.** RLS and server guards are written with the first table/action, then audited in M9.
4. **Mobile is designed, not squeezed.** Participant/volunteer layouts are checked throughout, not only at M10.
5. **Demo path first.** The participant → volunteer → coordinator → principal story is the critical path.
6. **No fake backend.** Every displayed count/record must come from Supabase or an honest empty state.
7. **Git checkpoint at every milestone.** Commit only after checks pass; never rewrite unrelated work.
8. **No new dependency without approval.** Pin versions; prefer platform/native solutions.

### Critical path

```
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11
```

M5 (challenge/schedule) is blocked by content/assets. M6 depends on M4 teams and M3 memberships. M8 depends on M6/M7 operational data. M9 hardens before demo.

---

## 2. Milestone summary

| ID | Milestone | Outcome | Effort |
|---|---|---|---|
| M0 | Repository and architecture preparation | Buildable Next.js + Supabase foundation, tokens, CI checks | M |
| M1 | Authentication and profiles | Signup, verification, login, reset, logout, profile | M |
| M2 | Event directory and event introduction | Database-backed Xplorer discovery | S–M |
| M3 | Event membership and role selection | Authorized roles, guarded routes, audit foundation | M |
| M4 | Participant registration and teams | Registration, team creation, invitations | L |
| M5 | Problem statement and schedule | Editorial challenge + exact timeline + copy actions | M |
| M6 | Volunteer room management and verification | Room scope, search, check-in, flags | L |
| M7 | Coordinator dashboard | Room board and drill-down | M–L |
| M8 | Principal administration | Event lifecycle, rooms, schedule, staff, audit | L |
| M9 | Security, RLS, and data validation hardening | Tested authorization boundaries | M–L |
| M10 | PWA and responsive refinement | Installable, mobile-polished, accessible | M |
| M11 | Testing and judge demo preparation | Rehearsed end-to-end demo and evidence | M |

Effort is relative, not a time promise. Content/asset blockers can compress or extend the schedule.

---

## 3. M0 — Repository and architecture preparation

**Objective:** Create a clean, buildable foundation that matches the approved architecture and design tokens, without building product features.

**Scope**

- Initialize Git, `.gitignore`, README, license decision.
- Scaffold Next.js App Router + TypeScript strict + Tailwind CSS v4; pin versions (candidate: Next 16.4.3, React 19.3.1, Tailwind 4.3.3).
- Add ESLint, Prettier, typecheck/build scripts, path aliases.
- Add shadcn/ui source setup, Radix primitives, Lucide; no second component library.
- Define semantic token layer in CSS and Tailwind theme mapping; add font setup (Manrope + Instrument Serif).
- Add base app shell, typography, focus styles, reduced-motion support.
- Add `.env.example` with names only; configure local env (not committed).
- Create Supabase dev project and migration folder; no application tables beyond a health check yet.
- Add Vercel project link (no deployment required) and GitHub repository.
- Add a simple health route or static shell to verify build.
- Record version decisions in a short `docs/DECISIONS.md`? Avoid extra docs; use this roadmap and commit messages.

**Expected files/modules**

`package.json`, lockfile, `tsconfig.json`, `next.config.ts`, `postcss.config.*`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/ui/*`, `src/lib/utils.ts`, `.env.example`, `.gitignore`, `README.md`, `supabase/config.toml`, `supabase/migrations/`.

**Dependencies:** approval to initialize repo; Supabase project access; Node/pnpm.

**Acceptance criteria**

- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- App renders a token-styled shell at 360 and 1440 without overflow.
- No secrets committed; `.env.example` has no values.
- Fonts load locally; no runtime Google Fonts request.
- Git checkpoint `chore: initialize Gatik Events foundation`.

**Security considerations**

- `server-only` boundary for admin client module (even if unused yet).
- No service key in client env.
- CSP/security headers scaffolded (may be refined in M9).
- Do not install unneeded dependencies; verify exact versions.

**Tests**

- Build/typecheck/lint; smoke screenshot at 360/1440; verify no console errors.

**Risks**

- Next.js 16 API changes (proxy/middleware, async cookies). Verify docs at implementation.
- Tailwind v4/shadcn compatibility; test before building components.
- Node 24/Vercel support; confirm.

---

## 4. M1 — Authentication and user profiles

**Objective:** One working auth system with verified email, secure sessions, and application profiles.

**Scope**

- Supabase Auth email/password signup, verification, login, logout, reset.
- Auth callback route with code exchange and safe redirects.
- Request proxy/middleware session refresh + route protection.
- Profile trigger and onboarding (full name; phone optional).
- Auth screens + verify-email + reset screens; loading/error/success states.
- Resend SMTP configuration and branded auth templates.
- Profile page (view/edit name/phone/avatar placeholder).

**Expected files/modules**

`src/app/(public)/login|signup|verify-email|forgot-password|auth/*`, `src/lib/supabase/{server,client,proxy}.ts`, `src/lib/auth/*`, `src/components/auth/*`, `supabase/migrations/*profiles*`, auth email templates/config notes.

**Dependencies:** M0; Supabase project; Resend domain/SMTP (or a temporary Supabase test SMTP for dev, clearly labeled).

**Acceptance criteria**

- New user signs up, receives verification email, verifies, logs in, sees a protected shell, logs out.
- Unverified user cannot enter the app; can resend.
- Password reset completes; expired/invalid link is handled.
- Duplicate email/wrong password do not leak account existence.
- Profile row exists and is editable; email is read-only.
- Session survives refresh; logout clears it.
- No passwords stored in app tables.

**Security considerations**

- `next` redirect allowlist; no open redirect.
- httpOnly/secure/SameSite cookies; auth callback validates code.
- Generic auth errors; rate limits from Supabase.
- No service role in auth actions.
- Email templates do not expose tokens in subjects/logs.

**Tests**

AUTH-01…AUTH-10 (see TEST_PLAN); manual email delivery check; keyboard/focus on forms.

**Risks**

- Resend domain verification/DNS access; email deliverability.
- Supabase redirect URL misconfiguration.
- Local testing without inbox; use test addresses/admin-confirmed demo accounts.

---

## 5. M2 — Event directory and event introduction

**Objective:** A database-backed directory and event introduction that already works for Xplorer and is not hardcoded to it.

**Scope**

- `events` and `event_schools` tables + seed Xplorer metadata.
- Directory query with visibility rules; search/filter; event cards.
- Event introduction page with dates, venue, status, description, poster/typographic mark.
- Draft visibility for principals only.
- Date-derived live/upcoming/completed badge in `Asia/Kolkata`.
- Empty/error/loading states.

**Expected files/modules**

`src/app/(app)/events/page.tsx`, `events/[slug]/page.tsx`, `src/lib/events/*`, `src/components/events/*`, migrations/seed.

**Dependencies:** M1.

**Acceptance criteria**

- Xplorer appears from the database with correct title/dates/venue/timezone.
- A second draft event is hidden from non-principals and visible to its principal.
- Card and introduction render correctly at 360/768/1440.
- No hardcoded event content in components.
- Search/filter produce real results; empty state is honest.

**Security considerations**

- RLS: draft events only principal; published visible to authenticated users.
- No unpublished description leak in directory queries.
- Event IDs/slugs validated; no open query params.

**Tests**

EVENT-01…EVENT-05; responsive screenshots.

**Risks**

- Branding/poster asset missing; use typographic interim mark.
- Date/timezone display bugs; test IST boundary.

---

## 6. M3 — Event membership and role selection

**Objective:** Establish event-scoped authority and the role-selection entry flow.

**Scope**

- `event_memberships` + helper functions/RLS.
- Role selection screen: only active memberships; locked/unavailable explanations.
- Role route guards; role switcher; event switcher.
- Seed principal/coordinator/volunteer demo memberships.
- Audit trigger/foundation for role changes.
- Permission-denied and revoked-role states.

**Expected files/modules**

`events/[slug]/roles/page.tsx`, role route layouts, `src/lib/auth/guards.ts`, `src/lib/auth/roles.ts`, memberships migration, audit foundation.

**Dependencies:** M1, M2.

**Acceptance criteria**

- A user with no memberships sees registration CTA or staff-assignment explanation, not role cards.
- A user with one role goes directly to that dashboard or sees a single card.
- A multi-role user can switch without changing data.
- URL tampering to an unauthorized role yields 403/redirect; no data renders.
- Revoked role disappears on next request.
- Audit entry created for seeded/manual role changes.

**Security considerations**

- No self-insert membership; RPC/service seed only.
- Guards + RLS; role context never trusted.
- Principal-only role grants.
- Last-principal protection (can be completed in M8).

**Tests**

AUTHZ-01/02/17, ROLE-01…ROLE-05.

**Risks**

- Circular RLS helpers; test with real JWTs.
- Seed principal bootstrap; define a safe seed script.

---

## 7. M4 — Participant registration and teams

**Objective:** The first complete participant vertical slice: register → create team → invite → accept.

**Scope**

- `event_registrations`, `teams`, `team_members`, `team_invitations`, `schools`/`event_schools` seed.
- Registration form + server validation + capacity/window checks.
- Team creation, roster, size meter, leader controls.
- Invite by email (in-app; Resend email if configured).
- Accept/decline/revoke/expire; token hashing.
- Team detail page and overview snapshot.
- Audit for team/invitation events (as applicable).

**Expected files/modules**

`participant/register`, `participant/team`, `src/lib/teams/*`, `src/lib/registration/*`, team RPC migrations, seed schools/participants.

**Dependencies:** M2, M3; Resend domain for email (in-app fallback).

**Acceptance criteria**

- Confirmed participant can create exactly one team; duplicate blocked.
- Team name uniqueness (case-insensitive) enforced.
- Team size cannot exceed 5; min 2 shown as eligibility.
- Invitee must be registered and unteamed; duplicate/expired/revoked invitations handled.
- Two concurrent last-slot acceptances: one succeeds, one gets capacity error.
- Team leader can view roster; non-member cannot.
- Registration is database-backed and survives refresh.

**Security considerations**

- Team/membership writes RPC-only; unique constraints.
- Invitation token hash, expiry, binding; no token in logs.
- RLS: teammates only; staff scope later.
- Capacity checks under lock; no race.
- Email content escaped; no user-supplied HTML.

**Tests**

REG-01…REG-06, TEAM-01…TEAM-10, INV-01…INV-08; concurrency test.

**Risks**

- Invitation email deliverability; keep in-app flow.
- Team leadership/removal policy unresolved; implement conservative rules and flag.
- Demo capacity: 12 seeded teams vs live-created team; resolve demo data.

---

## 8. M5 — Problem statement and schedule

**Objective:** Deliver the event’s editorial content and exact schedule from the database.

**Scope**

- `event_challenges` table + publish state; six required sections.
- Editorial reading page + section nav + copy statement/AI context.
- `schedule_items` table + seed exact Xplorer items (22 records).
- Schedule timeline with day tabs, now/next, notes, timezone.
- Empty/unpublished states.
- Server-side AI context generation.

**Expected files/modules**

`participant/challenge`, `participant/schedule`, `src/lib/challenges/*`, `src/lib/schedule/*`, migration/seed.

**Dependencies:** M4; **full problem statement content (blocker)**; schedule PDF (available/verified).

**Acceptance criteria**

- Challenge content is stored and rendered from DB; no PDF/image as final experience.
- Copy statement includes every stored section; copy AI context includes event/team-size/evaluation context.
- Copy success and clipboard-denied fallback work; aria-live announces.
- Schedule contains exactly the source items/times; no invented end times; notes are distinguishable.
- Day tabs and now/next use `Asia/Kolkata`.
- Unpublished challenge shows an honest state.

**Security considerations**

- Plain-text/structured rendering; no `dangerouslySetInnerHTML`.
- RLS: published challenge for registered participants/staff; principal all.
- Schedule publication visibility.
- No PII in copied context.

**Tests**

CHAL-01…CHAL-06, SCH-01…SCH-08; timezone boundary tests; clipboard manual test.

**Risks**

- Missing problem-statement body is a hard blocker; do not invent it.
- Schedule typo/version drift; preserve source and version changes.
- Browser clipboard permissions on mobile.

---

## 9. M6 — Volunteer room management and verification

**Objective:** A complete, secure field workflow: room → search → verify → check in/flag.

**Scope**

- `rooms`, `room_assignments`, `volunteer_assignments`, `check_ins` tables/RPCs.
- Seed 6 rooms, 12 teams, assignments, volunteer memberships.
- Volunteer overview, My Room, Teams, Verify, status update.
- Scoped search RPC (limit 10), confirmation dialog, check-in/duplicate/flag outcomes.
- Room roster and recent check-ins.
- Audit for check-ins/room status.

**Expected files/modules**

`volunteer/*`, `src/lib/operations/*`, room/check-in migrations, seed demo operations.

**Dependencies:** M3, M4; demo teams/participants.

**Acceptance criteria**

- Volunteer sees only assigned room/team data.
- Search returns only room-scoped participants and no email/phone outside scope.
- Verified check-in requires confirmed registration + team in room; duplicate blocked.
- Unregistered/ambiguous attempt stores a flagged record without creating an account.
- Room status update is audited and limited to allowed fields.
- Coordinator view later sees the same check-in.

**Security considerations**

- Room assignment checks in every RPC; RLS.
- No direct check-in inserts.
- PII minimization in search/flag records.
- Duplicate verified index.
- No offline writes.

**Tests**

VOL-01…VOL-10, AUTHZ-04/05/06, CHECK-01…CHECK-06.

**Risks**

- Demo data scale/capacity.
- Search performance/indexes.
- Ambiguous identity handling; confirmation-first UI.

---

## 10. M7 — Coordinator dashboard

**Objective:** Operational oversight with least-privilege room scope and drill-down.

**Scope**

- `coordinator_assignments`; scoped helpers.
- Coordinator overview, room board, rooms/teams/schools/volunteers pages.
- Room → team → school → participant drill-down with breadcrumbs.
- Real aggregate counts; exception list.
- Read-only check-in status and volunteer activity.

**Expected files/modules**

`coordinator/*`, `src/lib/operations/stats.ts`, `src/lib/auth/scope.ts`, components for room tiles/breadcrumbs.

**Dependencies:** M6.

**Acceptance criteria**

- Scope-specific coordinator sees only assigned rooms; all-room coordinator sees all.
- Counts match database queries (test with known seed).
- Drill-down preserves context and works on mobile.
- Cross-room ID guessing is denied.
- No edit actions beyond allowed scope.

**Security considerations**

- `coordinator_assignments` in RLS/RPCs; nullable room = all only when explicit.
- No profile directory leak; scoped roster RPC/views.
- Read-only operational data; no role/check-in mutation.

**Tests**

COORD-01…COORD-08, AUTHZ-07/08.

**Risks**

- RLS helper complexity/perf; index and test.
- Mobile density; use stacked cards, not shrunken tables.

---

## 11. M8 — Principal administration

**Objective:** Full event governance and the administrative half of the demo.

**Scope**

- Event CRUD/lifecycle/publish; settings; registration window/team rules/capacity.
- Schools management; participants/teams oversight.
- Rooms CRUD; team-to-room assignment; volunteer/coordinator assignment.
- Role grant/revoke by email; last-principal protection.
- Schedule CRUD/reorder/publish.
- Announcements; audit log UI.
- Event creation flow (new event, creator principal).
- Confirmation dialogs, validation, permission states.

**Expected files/modules**

`principal/*`, `src/lib/events/admin.ts`, `src/lib/people/*`, settings/event editor components, admin RPCs.

**Dependencies:** M6, M7; audit/role foundation.

**Acceptance criteria**

- Principal can create a draft event and publish it; it appears in the directory.
- Lifecycle transitions validate; invalid transitions rejected.
- Room/team/volunteer/coordinator assignments enforce capacity/membership/scope.
- Last active principal cannot be removed.
- Schedule edits persist and are visible to participants after publish.
- Every sensitive change has an audit entry.
- Non-principal cannot access any admin action.

**Security considerations**

- Principal-only RLS/RPC checks; event creation assumption documented.
- No service role in admin actions.
- Role changes audited; no self-elevation.
- Destructive actions confirm and never hard-delete referenced data.
- File upload validation if posters implemented.

**Tests**

PRIN-01…PRIN-15, AUTHZ-09/10, AUD-01/02.

**Risks**

- Scope creep (too many admin screens); prioritize demo-critical actions.
- Lifecycle edge cases; table-driven transition tests.
- Event creation governance unresolved.

---

## 12. M9 — Security, RLS, and data validation hardening

**Objective:** Prove the authorization boundaries and fix gaps before the demo.

**Scope**

- Full RLS policy review against the matrix; enable on every table.
- Real-JWT tests for participant/volunteer/coordinator/principal at table/RPC level.
- Server-action validation audit; every action guarded.
- Secret scan; client bundle check; `NEXT_PUBLIC_` audit.
- Invitation token, duplicate check-in, team capacity, last-principal tests.
- Security headers/CSP; cache-control and PWA cache audit.
- Permission-denied/error copy review.
- Dependency audit; remove unused packages.

**Expected files/modules**

Migrations/policies, tests, `next.config` headers, proxy/CSP, docs updates.

**Dependencies:** M1–M8.

**Acceptance criteria**

- All AUTHZ tests pass with real sessions/JWTs.
- No table has RLS disabled; no permissive `USING (true)` on operational data.
- No service-role key or token hash in client bundle.
- Rate-limit/abuse basics documented and tested where applicable.
- Security headers verified in preview/production.
- Known limitations documented honestly.

**Security considerations**

- This is the gate before any public demo; do not skip failed tests.
- Use a hosted dev Supabase project if Docker remains unavailable.
- Rotate any test credentials before production.

**Tests**

Full SEC/AUTHZ/RLS suite; bundle scan; header check; dependency audit.

**Risks**

- RLS recursion/perf; fix with definer helpers and indexes.
- Time to test all role/table combinations; prioritize critical boundaries.
- Local Supabase unavailable without Docker.

---

## 13. M10 — PWA and responsive refinement

**Objective:** Make the product installable, fast, and genuinely usable on phones without leaking data through caches.

**Scope**

- Manifest, icons, theme color, standalone, start URL.
- Service worker: static cache + offline page; network-only auth/operational data; update flow.
- iOS meta/safe-area; install prompt optional.
- Responsive QA at 360/390/430/768/1024/1280/1440.
- Mobile navigation polish; form/dialog keyboard behavior.
- Accessibility pass: keyboard, focus, labels, errors, contrast, reduced motion, targets.
- Performance: image dimensions, bundle, Lighthouse; fix highest-impact issues.

**Expected files/modules**

`public/manifest.webmanifest` or `app/manifest.ts`, `public/sw.js`, `public/icons/*`, `src/app/offline`, registration component, global styles, responsive fixes.

**Dependencies:** M9; approved brand mark/icons.

**Acceptance criteria**

- App installs on supported mobile/desktop; standalone launch works.
- Offline navigation shows offline page; no authenticated content cached.
- No horizontal overflow at required widths; primary actions reachable one-handed.
- Keyboard/focus/dialog behavior works; reduced motion respected.
- Lighthouse installability passes; performance/accessibility results recorded (not assumed).

**Security considerations**

- No sensitive caching; sign-out clears caches.
- Service worker scope/update safe; no stale user data on shared devices.
- CSP allows only required origins.

**Tests**

PWA-01…PWA-08, RESP-01…RESP-07, A11Y-01…A11Y-10, Lighthouse.

**Risks**

- Service worker caching bugs; test with hard reload/update.
- Icon asset missing; do not ship generic placeholder.
- Time spent on polish vs demo-critical bugs.

---

## 14. M11 — Testing and judge demo preparation

**Objective:** A rehearsed, evidence-backed end-to-end demo with reliable seed/reset and private credentials.

**Scope**

- Complete E2E suite for the four role journeys + event creation.
- Seed/reset script (idempotent) for 6 rooms/12 teams/volunteers/coordinators/participants.
- Judge access guide (private, gitignored) with accounts/roles/rooms; no passwords in repo.
- Demo script/rehearsal; fallback plan for network/email failure.
- Final security/RLS regression; build/typecheck/lint.
- Deploy production; verify domain/HTTPS/auth redirect/PWA.
- Capture evidence: screenshots, test results, architecture diagram, demo data summary.

**Expected files/modules**

`tests/e2e/*`, `supabase/seed/*`, demo docs (private credential file ignored), deployment notes.

**Dependencies:** M1–M10; domain approval; Resend/Supabase production config.

**Acceptance criteria**

- All five acceptance scenarios pass on the deployed URL.
- Demo reset restores known state in one command.
- Judge accounts work without inbox dependency (pre-verified) and are scoped correctly.
- No P0/P1 security/UI defects remain.
- Credentials are private; public repo has no secrets.
- Demo runs within the target time and recovers from a failed step.

**Security considerations**

- Demo credentials rotated/revoked after event.
- Production data never used in demo.
- Final bundle/header/cache scan.
- No shared staff code unless explicitly approved and implemented as a non-authorization gate.

**Tests**

Full TEST_PLAN exit criteria; demo rehearsal twice; failure injection (network, wrong room, duplicate check-in).

**Risks**

- Time pressure; prioritize working vertical slice over extra admin features.
- Judge device/network; have screenshots/local fallback.
- Domain/DNS/email delays; complete early.

---

## 15. Vertical slice checkpoints

| Checkpoint | Demonstrable outcome |
|---|---|
| After M2 | Sign up → verify → log in → see Xplorer from DB |
| After M4 | Register → create team → invite/accept → see roster |
| After M5 | Read/copy challenge → view exact schedule |
| After M6 | Volunteer searches room → verifies → checks in |
| After M8 | Coordinator drill-down + principal edits schedule/assignments |
| After M11 | Full four-role judge demo on production URL |

Do not declare a milestone complete because screens exist; the checkpoint flow must work with real database records.

---

## 16. Definition of done (per milestone)

- Feature works end-to-end with real Supabase data; no mocked backend.
- Server validation + RLS/guards cover the new data.
- Loading, empty, error, success, permission states exist where relevant.
- Mobile and desktop render without overflow; keyboard/focus checked.
- Tests listed for the milestone pass; actual commands/results recorded.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- No secrets/PII in code, logs, fixtures, or screenshots.
- Documentation updated if behavior/schema changed.
- Git checkpoint created with a clear message.

---

## 17. Dependency and approval gates

| Gate | Needed for | Status |
|---|---|---|
| Approve plan/architecture | Start M0 | **Pending** |
| GitHub repository creation | M0 | Not yet created |
| Supabase dev/prod projects | M0/M1 | Not yet created |
| Resend domain verification / SMTP | M1/M4 email | Not yet configured |
| Subdomain `events.shaikaakif.com` | M10/M11 | Proposed, pending |
| BigRock DNS access | Deployment | Not modified |
| Brand logo/poster files | M0 tokens/M10 PWA | Missing |
| Full problem statement | M5 | Missing (blocker) |
| Institution minor/guardian policy | Real participant launch | Missing |
| Demo access policy | M11 | Pending (recommend per-account credentials) |

---

## 18. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope exceeds hackathon time | High | Demo incomplete | Vertical slices; cut non-critical admin/reporting; freeze features before M10 |
| Problem statement content missing | High | M5 blocked | Request exact copy now; do not invent; ship challenge page with honest unpublished state if late |
| Branding assets missing | Medium | Generic look/PWA icons | Use typographic event mark; request logos early; no placeholder icons in production |
| RLS bugs/leaks | Medium | Security failure/judging loss | Real-JWT tests, matrix review, M9 gate, least privilege |
| Email deliverability/DNS | Medium | Auth/invite failure | Use pre-verified demo accounts; in-app invitations; test early |
| Local Supabase requires Docker | Medium | Slower DB tests | Hosted dev project or install Docker with approval |
| Team capacity concurrency | Low | Overfilled team | RPC row lock + unique constraints + concurrency test |
| Demo data capacity/reset | Medium | Demo breaks | Idempotent seed; leave a slot; rehearse reset |
| Mobile overflow/density | Medium | Poor UX score | Design mobile-first; test 360 throughout |
| Service worker caches sensitive data | Low | Privacy incident | Static-only cache; explicit tests |
| Domain/DNS delay | Medium | No production URL | Start early; use Vercel preview as fallback; do not modify DNS without approval |
| AI/agent over-builds decorative UI | Medium | Wasted time | Design system first; prioritize flows; no heavy animation/chart libs |

---

## 19. Post-MVP roadmap

1. QR-based check-in and printable team passes.
2. Realtime room/check-in board with scoped channels.
3. Safe offline check-in with conflict resolution and audit.
4. Certificates, participation reports, and exports.
5. Institution/tenant model and multi-campus administration.
6. Event templates and reusable schedule/room presets.
7. Automated reminders/announcements via Resend.
8. Equipment/inventory and resource allocation.
9. Public event pages and external registration.
10. Analytics and outcome reporting with privacy controls.
