# Gatik Events — Judge Demo Plan

**Status:** Planning only. No accounts, seed data, or deployment exist yet.
**Source of truth for:** demo narrative, synthetic data, account/credential policy, run-of-show, fallbacks, and judge Q&A.
**Related:** [Product spec](PRODUCT_SPEC.md) · [Design](DESIGN.md) · [Test plan](TEST_PLAN.md) · [Security plan](SECURITY_PLAN.md)

---

## 1. What judges should understand

1. Campus events are currently coordinated through disconnected WhatsApp groups, spreadsheets, emails, and paper lists.
2. Gatik Events gives one institution one system for **event discovery, role-based operations, teams, rooms, schedules, verification, and administration**.
3. Xplorer 2026 is a real, database-backed configuration — not a hardcoded demo — and the same product can host the next event.
4. Roles are not cosmetic: a participant cannot become a volunteer by editing a URL, and a volunteer cannot see another room.
5. The demo is a working end-to-end slice, not a mockup.

**One-line pitch:** *Gatik Events is a role-aware campus activity platform that takes an institution from event creation to participant check-in — starting with Xplorer 2026.*

---

## 2. Demo thesis and narrative

### Opening (problem)

“A 24-hour campus hackathon has six rooms, twelve teams, multiple schools, hundreds of moving parts, and a schedule that changes. Today that usually lives across a WhatsApp group, a spreadsheet, and a printed list. The result is duplicate registrations, unclear ownership, and no reliable answer to ‘who is actually here?’”

### Turn (solution)

“Gatik Events puts one database behind the whole event. Participants register and form teams; volunteers verify the right room; coordinators see the operational chain; the principal runs the event. Xplorer 2026 is the first configuration, not the product.”

### Close (proof + extensibility)

“Every screen you saw is backed by Supabase with event-scoped roles and RLS. The same platform can create the next event without another app — and the security model is designed so convenience never becomes permission.”

Do not overclaim impact metrics or “first-ever” status. The evidence is the working flow.

---

## 3. Demo data (synthetic only)

Seed target:

| Entity | Count | Notes |
|---|---|---:|
| Event | 1 | Xplorer 2026 — Chapter 4; status `registration_open` for the demo; date-derived “Live” badge |
| Rooms | 6 | `Room 1`–`Room 6`; capacity 2 teams each |
| Teams | 12 | Two per room; names like “Atlas”, “Nova”, etc.; synthetic |
| Participants | 24–36 | Synthetic names/emails; no real student data |
| Volunteers | 6 | One per room |
| Coordinators | 2 | One all rooms; one Rooms 1–3 (scope demo) |
| Principal | 1 | Demo administrator |
| Participant demo accounts | 3 | For participant/invitee flows |
| Schedule items | 22 | Exact source content, including notes |
| Challenge | 1 | Published only when real content is supplied |

**Labels are not credentials.** Passwords are generated after accounts exist and stored in a private, gitignored judge guide — never in this file, the public repo, or screenshots.

### Demo capacity note

The event is configured for 12 teams / 2 per room. A live-created 13th team would exceed the default cap. Choose one before rehearsal:

- **Preferred:** leave one open team slot (seed 11 teams); the live participant creates Team 12; principal assigns it to the room with one team; the board becomes full. This demonstrates creation + allocation without breaking the 12-team story.
- **Alternative:** demo team creation on a separate “demo” event with capacity headroom, then return to Xplorer for operations.

Do not silently seed 13 teams into a 12-team configuration.

---

## 4. Accounts and access

| Label | Role | Scope | Purpose |
|---|---|---|---|
| Principal Demo | Principal | Xplorer event | Admin/lifecycle/schedule/staff |
| Coordinator Demo (All) | Coordinator | All 6 rooms | Full operational board |
| Coordinator Demo (Scoped) | Coordinator | Rooms 1–3 | Least-privilege proof |
| Volunteer Demo 1–6 | Volunteer | Room 1–6 respectively | Room check-in flow |
| Participant Demo 1 | Participant | Own team | Registration/team/challenge |
| Participant Demo 2 | Participant | Invitee | Accept invitation |
| Participant Demo 3 | Participant | No team | Create-team flow |

- Emails: synthetic pattern such as `demo.principal@example.com`; pre-confirmed at seed so the demo does not depend on an inbox.
- Passwords: generated strong unique values; stored only in a private local judge guide (e.g., `docs/private/JUDGE_ACCESS.local.md`, gitignored) after accounts exist.
- Do not use real personal email addresses.
- Rotate/revoke after the event.

### About the requested “staff dashboard password”

The product brief includes a request for a particular password that volunteers/coordinators/principal must enter before accessing dashboards. That is **not** how authorization should work: a shared code cannot decide which room/role a person has, and it creates a false sense of security.

Recommendation:

- Use **per-account passwords + event memberships**; the role is enforced by the database, not a shared code.
- If a demo-only staff gate is still required, implement it as an explicitly labeled, server-side, rate-limited, environment-configured gate for staff demo accounts, disabled in production. It must **not** grant a role, bypass RLS, or replace login. Treat it as demo theater, not security.
- Do not commit the code or credentials. Decide before M11 (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

---

## 5. Pre-demo checklist

- [ ] Deployed URL reachable over HTTPS; certificate valid.
- [ ] Supabase production project seeded; RLS enabled; demo accounts confirmed.
- [ ] Resend auth email tested; invitation email tested if included.
- [ ] Demo reset script run; known counts verified.
- [ ] Participant/volunteer/coordinator/principal accounts tested in separate browser profiles or incognito windows.
- [ ] Challenge is published with approved real content (or the demo explicitly shows the unpublished state).
- [ ] Schedule seed matches the official PDF.
- [ ] Mobile device/emulator ready for one flow (optional but persuasive).
- [ ] Screenshots/video fallback prepared in case of venue network failure.
- [ ] Private judge guide available offline; no passwords on screen or in slides.
- [ ] Notifications silenced; browser zoom/projector resolution checked.
- [ ] A second facilitator ready to switch accounts/reset data.

---

## 6. Run of show (10 minutes)

| Time | Role | Action | What to say / show |
|---:|---|---|---|
| 0:00 | — | Hook | The disconnected-tools problem; Xplorer is the first real event |
| 0:45 | Participant | Sign in; event directory; open Xplorer; role selection | One auth, event from DB, only authorized roles |
| 1:45 | Participant | Overview; registration status; My Team | “Your trail”: registered → team → check-in |
| 2:30 | Participant | Create/invite/accept team (use prepared pending invite if live email is risky) | Database-backed team, size limit, duplicate prevention |
| 3:30 | Participant | Problem statement; copy AI context; schedule | Editorial challenge + exact timeline, not a PDF |
| 4:30 | Volunteer | Sign in as Room 3 volunteer; open My Room; search “Aarav” | Scope: only this room/team |
| 5:15 | Volunteer | Verify identity; record check-in; show duplicate/unregistered | Confirmation-first; no fake attendance |
| 6:00 | Coordinator | Sign in; room board; drill Room 3 → team → school → participants | Operational chain; check-in reflected |
| 7:00 | Coordinator | Show scoped coordinator only sees Rooms 1–3 | Least privilege, not UI hiding |
| 7:45 | Principal | Command center; lifecycle; edit schedule; assign room/volunteer | Real admin, audit trail |
| 8:45 | Principal | Create/publish a second event (optional) | Extensibility beyond Xplorer |
| 9:30 | — | Close | Architecture/security/roadmap; invite questions |

If time is short, cut the second-event creation and the duplicate check-in; keep participant → volunteer → coordinator → principal.

---

## 7. Screen-by-screen cues

1. **Directory:** “This list is a query, not a hardcoded page.”
2. **Role selection:** “These cards come from event memberships. There is no role dropdown that grants access.”
3. **Participant team:** “Team size is event-configured; the database enforces one team per participant.”
4. **Challenge:** “The copy actions are generated from stored content; judges can use the AI context in their own tools.”
5. **Schedule:** “Every time comes from the official schedule; point-in-time items aren’t given invented end times.”
6. **Volunteer search:** “The search RPC is room-scoped; a volunteer cannot enumerate the event.”
7. **Check-in:** “One verified check-in per participant; unregistered people are flagged, not fabricated into accounts.”
8. **Coordinator drill-down:** “Room → team → school → participant is the operational hierarchy.”
9. **Principal audit:** “Role and assignment changes are auditable.”
10. **Security:** “RLS is the last line, not the only line; server actions and RPCs re-check.”

---

## 8. Judge Q&A preparation

| Question | Answer |
|---|---|
| Is this just a hackathon portal? | No. Xplorer is the first event; events are database records and roles are event-scoped. |
| How do you prevent a participant becoming principal? | Memberships are server/DB authority; URL role is re-validated; RLS and RPCs reject self-elevation. |
| How does a volunteer avoid seeing other rooms? | Active room assignment is required by search/roster/check-in RPCs and RLS. |
| What happens if two people accept the last team slot? | The accept RPC locks the team and re-checks capacity; one succeeds, one gets a capacity error. |
| Is the schedule real? | It is seeded from the official PDF; exact/approximate times are preserved, missing details aren’t invented. |
| Is any of this mocked? | No operational data is mocked; demo participants are synthetic and labeled. Empty states are real. |
| What about email? | Supabase Auth uses Resend SMTP; in-app invitations work even if email delivery fails. |
| Can it handle other events? | Yes: create event, configure rooms/schedule/team rules, publish; no separate app. |
| What’s not done? | Offline check-in, realtime, QR, certificates, multi-campus tenancy, formal penetration testing. |
| How is privacy handled? | Data minimization, scoped access, no public directory, no PII in logs; minor/guardian policy still needs institutional approval. |
| Why Next.js/Supabase? | Server-rendered auth pages, typed mutations, managed Postgres with RLS, fast MVP without a separate API service. |
| What would you do with more time? | QR check-in, realtime operations board, safe offline mode, institution tenancy, analytics. |

---

## 9. Failure fallbacks

| Failure | Fallback |
|---|---|
| Venue Wi-Fi down | Local screenshots/video + architecture diagram; narrate the flow; use mobile hotspot |
| Email verification slow | Pre-confirmed demo accounts; show the verification screen separately |
| Invitation email not delivered | Use in-app invitation/inbox; explain email is a notification |
| Supabase/Vercel outage | Local production build with seeded dev project; recorded backup |
| Wrong role/account | Use a second browser profile; reset via seed; never edit DB live |
| Duplicate check-in demo | Show the duplicate outcome intentionally; it proves the guard |
| Challenge content missing | Show honest unpublished state; do not invent content |
| Time overrun | Cut second event and optional admin edits; keep four-role path |

---

## 10. Evidence to show judges

- Live four-role flow on the deployed URL.
- ERD/database schema with event-scoped memberships.
- RLS/permission matrix and a short “attempted URL tamper” demo.
- Exact schedule mapping to the official PDF.
- Test results (with actual commands/results) and responsive screenshots.
- Roadmap: QR, realtime, offline, certificates, multi-campus.

Do not show fabricated analytics, fake participant counts, or unverified performance/accessibility claims.

---

## 11. Post-demo

- Revoke/rotate demo credentials and any demo staff code.
- Remove or archive synthetic demo data if the institution continues using the platform.
- Record judge feedback/questions; convert into open questions/roadmap.
- Tag the demo commit/release and archive evidence.
- Do not leave service-role keys or private judge guides in a public repository.

---

## 12. Demo success criteria

- A judge can explain the problem, the four roles, and why event-scoped authorization matters.
- Participant registration/team/challenge/schedule works live.
- Volunteer room search/check-in works and is visibly scoped.
- Coordinator drill-down reflects the check-in.
- Principal can change an operational detail and it persists.
- The team can state limitations honestly and show a credible roadmap.
