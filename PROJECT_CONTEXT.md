# PROJECT_CONTEXT.md
## Gatik Events — Complete Hackathon Knowledge Document

**Document purpose:** A permanent, self-contained knowledge reference for the Gatik Events project. It is written for humans, AI coding agents, presentation-generation agents, and anyone preparing a pitch, demo, architecture explanation, or future development plan.

**Project status as of 31 October 2026:** Product discovery and architecture planning only. No application source code, database, deployment, or demo accounts exist yet. This document describes the intended product, the reasoning behind it, and the boundaries of what is verified versus assumed.

**How to use this document:** Start with §1–§5 for the story, §6–§7 for the product, §8–§11 for feasibility and value, and §12–§13 for demo/pitch preparation. Detailed implementation rules live in the linked `docs/` files. Do not treat a planned feature as implemented.

---

## 1. Project Identity

### Project name

**Gatik Events**

### Tagline

**Every campus moment, coordinated.**

Alternative working lines (not final brand copy):

- “One campus. Every activity. One place.”
- “From sign-up to showdown.”
- “The operating system for campus activities.”

### One-line pitch

**Gatik Events is a role-aware campus activity platform that takes an institution from event creation to participant check-in — starting with Xplorer 2026.**

### Project category

Education technology / campus operations / event management / institutional SaaS. The first deployment is a hackathon event, but the product category is broader: a multi-event campus activity management platform.

### Core concept

One authentication system, one event directory, one database, and four role-specific experiences — Participant, Volunteer, Activity Coordinator, and Principal/Event Administrator — for the full lifecycle of a campus activity.

The platform is **event-independent**. Xplorer 2026 is the first configured event, not the product’s identity. Annual Day, Sports Day, science exhibitions, cultural festivals, workshops, inter-college competitions, and club activities should be addable as new event records without building another application.

### Overall vision

A college should not need a different WhatsApp group, spreadsheet, Google Form, printed list, and ad-hoc volunteer system for every activity. Gatik Events aims to become the institution’s shared operating layer for campus activities: discoverable events, trustworthy registration, team formation, room and schedule coordination, ground-level verification, and administrative oversight — with privacy and role boundaries designed in.

---

## 2. Hackathon Context

### What is confirmed

- This is a **real-world college hackathon project**.
- The supplied evaluation criteria and weights are:

| Criterion | Weight |
|---|---:|
| Problem understanding | 10% |
| User experience and UI design | 20% |
| Data/domain modeling | 10% |
| Solution approach and execution | 30% |
| Working solution and end-to-end demo | 20% |
| Innovation, extensibility and roadmap | 10% |

- The first configured event is **Gatik Xplorer 2026 — Chapter 4**, a 24-hour student hackathon organized by Gatik Junior College, The Bodhi Tree Campus, Bhanur, Telangana, India, held **31 October – 1 November 2026**.
- The supplied project brief defines the product direction: a campus activity management platform with four roles, Supabase Auth, Resend email, Supabase PostgreSQL, Next.js, TypeScript, Tailwind CSS, Vercel, GitHub, a PWA, a `shaikaakif.com` subdomain, a light-first theme, and Xplorer as the first event.
- Xplorer participant teams are configured at **2–5 participants** according to the supplied brief. This is an event rule, not a statement about the build team’s size.
- The official Xplorer schedule PDF was located and visually verified during planning. It contains the 31 October and 1 November schedule, including approximate overnight notes.

### What is not confirmed

- The official **hackathon name, theme, track/category, and full challenge brief** are **Not yet provided** in the available workspace. The project brief is the product specification, not necessarily the competition’s official brief.
- The build team’s size, composition, roles, and available time are **Not yet provided**.
- The exact judging format, demo duration, venue, network, and device constraints are **Not yet provided**.
- The full Xplorer problem statement content (beyond its six section headings) is **Not yet provided**.
- Brand asset files and usage rights are **Not yet provided**.

Do not invent these details for a pitch. If a slide needs an official hackathon name/theme, retrieve it from the organizers or the user first.

### The challenge being addressed

The supplied brief frames the challenge as: **how can an educational institution organize, coordinate, and monitor campus activities through one centralized application instead of disconnected tools?**

Xplorer exposes the operational problem vividly:

- Students need to know how to register, who is on their team, what the challenge is, and when/where to be.
- Volunteers need to verify the right people in the right room without seeing the whole event.
- Coordinators need to move from room to team to school to participant and spot exceptions.
- The principal needs to configure the event, rooms, schedule, staff roles, and participation without a separate admin tool.
- The next event should not require rebuilding the application.

### Why this challenge matters

Campus activities are recurring, multi-role, time-sensitive, and often run by students and staff who already have other responsibilities. Disconnected tools create:

- duplicate or missing registrations;
- unclear team membership and eligibility;
- room/team allocation confusion;
- no reliable check-in record;
- privacy risks when participant lists are shared broadly in chat groups;
- repeated manual setup for every event;
- no institutional memory after the event.

A shared platform can reduce operational friction, improve participant experience, and create a reusable institutional capability rather than a one-off event page.

### How the project aligns with the judging criteria

| Criterion | How Gatik Events addresses it |
|---|---|
| Problem understanding | Role-specific workflows grounded in a real Xplorer event; explicit problem framing and operational pain points |
| UX/UI | Light-first institutional design, distinct role dashboards, mobile-first field flows, accessibility and state design |
| Data/domain modeling | Normalized event-scoped schema, memberships/roles, teams, rooms, assignments, check-ins, schedule, constraints |
| Solution approach/execution | Working vertical slices with real Supabase data, server-side authorization, RLS, and a practical MVP scope |
| Working demo | End-to-end participant → volunteer → coordinator → principal story with synthetic data and a reset plan |
| Innovation/extensibility | Multi-event architecture, event-scoped RBAC, AI-ready challenge context, reusable operational model, roadmap |

### Competition constraints (known and assumed)

**Known:** hackathon format; six judging criteria/weights; the product decisions in the supplied brief; Xplorer event dates/venue; team-size rule for Xplorer participants; schedule source.

**Assumed unless corrected:** limited build time; a small team; free-tier hosting; single institution; demo-focused MVP; no budget for paid services beyond free tiers; no access to real participant data for development.

**Unknown:** official submission requirements, slide count, demo time limit, judging Q&A format, whether a live deployment is mandatory, and whether source code is judged. These must be confirmed.

---

## 3. Problem Discovery

### Detailed problem statement

Campus activities are usually coordinated with a patchwork of tools: messaging groups for announcements, spreadsheets for registrations, forms for data collection, printed schedules, and manual room/team lists. Each tool solves one slice, but none owns the full lifecycle.

The result is not merely inconvenience. It is a **coordination and trust problem**:

- Participants do not have one authoritative place to register, form a team, read the challenge, and check the schedule.
- Organizers cannot easily answer “who is registered, who is on which team, which room are they in, and who has actually arrived?”
- Volunteers may be given broad access to participant lists or rooms they are not responsible for.
- Coordinators lack a drill-down path from an operational room to a team, school, and participant.
- Principals/administrators repeat configuration work for every event and lack an audit trail for role/room changes.
- Sensitive participant information spreads through channels that were not designed for it.
- After the event, operational knowledge is lost.

### Root causes

1. **No shared source of truth.** Registration, teams, rooms, and schedules live in different tools.
2. **No event-scoped role model.** People are given broad access because the tools cannot express “volunteer for Room 3 only.”
3. **Event-specific build habits.** Each event gets a new form/page/group instead of a reusable configuration.
4. **Manual verification.** Check-in is a paper list or a message, with no timestamp/attribution.
5. **Weak lifecycle thinking.** Registration, team formation, room allocation, live operations, and closure are treated as separate ad-hoc tasks.
6. **Privacy as an afterthought.** Participant lists are shared widely because the system cannot scope access.
7. **No operational hierarchy.** A room is not linked cleanly to teams, schools, and participants.

### Who is affected

- **Participants/students:** unclear next steps, duplicate registrations, team confusion, missed schedule changes.
- **Volunteers:** ambiguous responsibility, manual search, no reliable check-in record, pressure to “just mark them present.”
- **Activity coordinators:** limited visibility, manual reconciliation, no drill-down, difficulty spotting exceptions.
- **Principals/administrators:** repeated setup, no audit trail, no event-level participation picture.
- **Institution:** lost knowledge, reputational risk from poor event operations, privacy exposure.

### Current alternatives and their limitations

| Alternative | Strengths | Limitations |
|---|---|---|
| WhatsApp/Telegram groups | Fast, familiar, low cost | No structured registration/teams/rooms; information buried; broad data exposure |
| Google Forms + Sheets | Easy collection, familiar | No role model, no team/room integrity, manual reconciliation, weak audit/privacy |
| Event platforms (generic ticketing) | Registration/payments | Not built for campus teams, rooms, volunteers, schools, or institutional roles |
| College ERP/portal | Institutional integration | Often rigid, not event-operational, slow to configure for a hackathon |
| Custom one-off event site | Tailored experience | Rebuilt every event; no reuse; security/roles often neglected |
| Paper + spreadsheets | Resilient, simple | No real-time truth, duplicate/illegible records, no audit, manual search |

### Real-world examples and supporting evidence

**Not yet provided / not independently researched.** No user interviews, surveys, or institutional statistics have been supplied. The problem framing above is derived from the product brief and the operational shape of Xplorer (6 rooms, 12 teams, multiple schools, volunteers, coordinators, schedule changes).

Do not claim “X% of colleges face this” or “this saves Y hours” without evidence. Those are hypotheses to validate, not facts.

### Why the problem deserves attention

Even a well-run event can fail at the seams: a participant is not on the room list, a team is over capacity, a volunteer cannot verify someone, a schedule change does not reach the right people, or a principal cannot see which room is unstaffed. These are not glamorous problems, but they determine whether an event feels organized and trustworthy. A reusable platform turns a recurring burden into an institutional capability.

### Verified versus assumed

**Verified from supplied material**

- Xplorer has a detailed schedule, multiple roles, rooms/teams, and a 2–5 participant team rule.
- The product brief explicitly calls out WhatsApp, email, spreadsheets, and paper as current alternatives.
- The product brief explicitly requires event-specific roles, RLS, audit, and participant privacy.

**Assumptions to validate**

- Institutions will reuse one platform across different event types.
- Volunteers can operate a mobile-first verification flow under live event pressure.
- Principals want event-level configuration rather than IT-only administration.
- Participants value a single event workspace enough to adopt it.
- The institution will approve storing student contact data in Supabase under an appropriate policy.

---

## 4. Brainstorming and Idea Exploration

**Important honesty note:** No prior team brainstorming transcript or design workshop notes were supplied in the workspace. The alternatives below are the planning analysis performed for this document; they are not fabricated quotes or reconstructed team discussions. Where the original product brief already made a decision, that is marked as a decision, not a brainstorm.

### Original idea

Build **Gatik Events**, a campus activity management platform, with **Xplorer 2026 — Chapter 4** as the first configured event. Four roles share one authentication system and one event directory but receive different dashboards and permissions.

### Alternatives explored

#### Alternative A — Event-specific hackathon portal

A polished site just for Xplorer: registration, problem statement, schedule, team list, check-in.

**Strengths:** Fast to build; tailored content; easier demo; no multi-event complexity.

**Weaknesses:** Becomes obsolete after the event; duplicates work for Annual Day/Sports Day; weak extensibility story; role model may be shallow.

**Verdict:** Rejected as the product, retained as the first event configuration.

#### Alternative B — Forms + spreadsheet + messaging group

Use Google Forms/Microsoft Forms for registration, a spreadsheet for teams/rooms, WhatsApp for coordination, and paper for check-in.

**Strengths:** Near-zero build cost; familiar; resilient; no new account.

**Weaknesses:** No authorization/privacy boundary; no integrity constraints; manual reconciliation; no audit; poor participant experience; no reusable product.

**Verdict:** This is the status quo the product is trying to improve, not a solution.

#### Alternative C — WhatsApp bot / chat-first assistant

A bot that answers schedule questions, collects registrations, and sends reminders.

**Strengths:** Meets users where they are; low-friction; good for announcements.

**Weaknesses:** Chat is poor for structured team/room/admin workflows; discoverability and data integrity suffer; role enforcement and auditing are hard; platform dependence.

**Verdict:** Useful future notification channel, not the core product.

#### Alternative D — Full campus ERP / institution operating system

A broad platform covering events, attendance, fees, academics, inventory, and communication.

**Strengths:** Long-term institutional value; one vendor; deep integration.

**Weaknesses:** Far too large for a hackathon MVP; high risk of shallow features; event workflow still needs to be excellent; procurement/security complexity.

**Verdict:** Rejected for the MVP; a future direction beyond the event platform.

#### Alternative E — Role-aware multi-event campus activity platform (selected)

A focused platform for campus activities, with event-scoped roles, reusable configuration, and operational workflows from registration to check-in.

**Strengths:** Directly addresses the real coordination problem; reusable across events; demonstrates data modeling and security; scoped enough for a working demo; extensible without pretending to be an ERP.

**Weaknesses:** More schema/authorization complexity than a single-event site; requires disciplined scope; content/assets and demo data add work.

**Verdict:** **Selected.** It best balances problem fit, hackathon feasibility, differentiation, and a credible long-term product.

### Other approaches considered inside the selected concept

| Decision | Options considered | Why selected |
|---|---|---|
| Role model | Global role column vs event memberships | Event memberships allow a person to be participant in one event and volunteer in another; avoids a single global role as the sole authority |
| Participant data | Separate `participants` table vs profile + event registration | Registration + profile avoids duplication and keeps event-specific data scoped |
| Schedule | Embed PDF vs structured timeline | Structured items enable date selection, now/next, editing, and reuse; PDF remains a source document |
| Teams | Leader-only manual roster vs database invitations | Invitations with tokens and constraints prevent duplicates and support real participant self-service |
| Room allocation | Room has fixed team names vs assignment records | Assignment records support capacity, reassignment, and drills |
| Check-in | Paper/boolean vs append-only attempts | Attempts preserve flagged/unregistered outcomes and accountability |
| Volunteer scope | All-event access vs assigned rooms | Least privilege and participant privacy |
| Coordinator scope | All rooms by default vs explicit assignments | “Authorized rooms” requires a real scope model |
| UI theme | Dark developer dashboard vs light institutional | Light-first fits campus daylight use, trust, and the supplied brand direction; avoids generic AI-dashboard aesthetics |
| PWA offline | Full offline check-in vs static shell only | Offline writes create conflict/security risk; static shell + honest offline page is safer for MVP |
| AI | Integrated chatbot vs copyable AI context | The brief asks for a prepared context prompt, not an AI feature; copying is lower risk and immediately useful |

### Important insights and reasoning

1. **The event is the tenant boundary.** Almost every operational rule — roles, teams, rooms, schedule, check-in — is event-specific. Making this explicit simplifies security and extensibility.
2. **The operational hierarchy is the product.** Coordinator → Room → Team → School → Participant is more compelling than a dashboard of disconnected cards.
3. **Trust is a feature.** Duplicate prevention, scoped search, check-in attribution, and audit logs are part of the user experience, not just backend hygiene.
4. **A working vertical slice beats a broad unfinished app.** The demo must complete participant → volunteer → coordinator → principal, not show ten half-built admin pages.
5. **The visual identity must be specific.** A light institutional system with a route/waypoint motif and Gatik/Xplorer colors is more memorable than another generic gradient dashboard.
6. **The AI context copy is a bridge, not a chatbot.** It helps participants use their own tools without putting a model/API key in the product.
7. **Honest scope is persuasive.** Stating what is not built (offline check-in, realtime, QR, multi-campus) builds more trust than overclaiming.

---

## 5. Proposed Solution

### What the solution is

A responsive, installable web platform with:

- one Supabase Auth identity per user;
- an event directory loaded from the database;
- event-specific memberships that determine available roles;
- a participant workspace for registration, teams, challenge, and schedule;
- a volunteer field workflow for room-scoped search, verification, and check-in;
- a coordinator operations view with room/team/school/participant drill-down;
- a principal administration area for event lifecycle, rooms, schedule, schools, staff roles, announcements, and audit;
- an exact, structured Xplorer schedule seeded from the official PDF;
- a reusable, event-independent schema and UI.

### How it addresses the problem

| Problem | Solution behavior |
|---|---|
| Disconnected registration/teams | One participant workspace backed by one database |
| Unclear roles/access | Event memberships + server guards + RLS; role selection never grants access |
| Room/team confusion | Explicit room assignments with capacity and coordinator drill-down |
| Unreliable check-in | Volunteer-only, room-scoped, confirmation-first check-in with duplicates/flags |
| Repeated event setup | Events, rooms, schedules, team rules, and staff roles are records, not code |
| Privacy exposure | Least-privilege scopes; no global participant directory; no public caches of operational data |
| Lost history | Audit log for role, event, assignment, and check-in changes |

### How it works from the user’s perspective

1. Sign up, verify email, log in.
2. See the event directory; open Xplorer 2026.
3. See only the roles the user is authorized for; choose one.
4. Participant: register, create/join a team, read/copy the challenge, view the schedule.
5. Volunteer: open the assigned room, search a participant, verify, check in or flag.
6. Coordinator: see authorized rooms, drill into teams/schools/participants, spot exceptions.
7. Principal: run the event, edit the schedule, assign rooms/staff, publish changes, review audit.
8. Switch roles/events without a second account, subject to the same membership checks.

### Main operating principle

**The database is the source of truth; the UI is a scoped view of it.** Role labels, counts, teams, rooms, schedules, and check-ins are records. Authorization is enforced on the server and in Postgres, not by hiding buttons.

### What makes it different

- **Event-scoped multi-role identity** rather than a single global “admin/student” flag.
- **Operational chain** Room → Team → School → Participant, designed for coordinators.
- **Least-privilege volunteer field workflow** instead of an all-event participant list.
- **Reusable event configuration** rather than a one-off hackathon page.
- **AI-ready challenge context** generated from stored content.
- **Light, institutional design** grounded in Gatik/Xplorer rather than a generic dark dashboard.
- **Security visible in the product** through scoped search, duplicate prevention, and audit.

### Why the approach is practical

- The core entities and workflows are well understood.
- Supabase provides auth, Postgres, RLS, and storage without a separate backend.
- Next.js supports server-rendered authenticated pages and typed mutations.
- The MVP can be demonstrated with synthetic data and a small number of screens.
- The hardest part — authorization — is constrained by a clear event/role/room model, not an open-ended permission system.
- The platform can start with one real event and grow by configuration, not forks.

---

## 6. Product and Application Vision

### What application is being built

A campus activity management platform with a public entry/auth experience and four role workspaces. Xplorer 2026 is the first real event configuration, seeded with its schedule, rooms, teams, staff, and challenge (when content is supplied).

### Primary purpose

Give an institution one trustworthy system to run campus activities end-to-end, while giving each role only the information and actions they need.

### Target users

| User | Context | Primary needs |
|---|---|---|
| **Participant** | Student joining an event, often on a phone | Register, form a team, understand the challenge, know what/where/when |
| **Volunteer** | Student/staff member running a room | Find the right participant, verify registration, check in, flag exceptions |
| **Activity Coordinator** | Faculty/staff supervising rooms | See operational status, drill into teams/schools, spot problems |
| **Principal / Event Administrator** | Institution leader/event owner | Create/configure/publish events, allocate rooms/staff, monitor participation |

### Personas (role archetypes, not invented people)

No real user interviews or personas were supplied. These are design archetypes based on the roles:

- **The Participant** wants a clear next step, not a portal maze. They may be on a phone, in a crowd, with limited time.
- **The Volunteer** is accountable for one room and needs speed plus confidence that they are checking in the right person.
- **The Coordinator** needs a map of the operation and a fast path to exceptions, not raw tables.
- **The Principal** needs control with guardrails: lifecycle, configuration, staff scope, and an audit trail.

Do not attribute quotes, demographics, or research findings to these archetypes.

### Main user journeys

1. **Participant:** sign up → verify → directory → Xplorer → Participant role → register → create team → invite/accept → challenge → schedule.
2. **Volunteer:** sign in → Xplorer → Volunteer → assigned room → search participant → verify → check in / flag.
3. **Coordinator:** sign in → Xplorer → Coordinator → authorized rooms → room → team → school → participants → check-in status.
4. **Principal:** sign in → Xplorer → Principal → event health → edit schedule/rooms/staff → publish → audit.
5. **Extensibility:** principal creates a new event, configures rules/schedule/rooms, publishes; it appears in the directory.

### End-to-end experience

```
Auth → Event directory → Event introduction → Role selection → Role dashboard
                                                        ├── Participant: register/team/challenge/schedule
                                                        ├── Volunteer: room/verify/check-in
                                                        ├── Coordinator: rooms/teams/schools/drill-down
                                                        └── Principal: lifecycle/rooms/schedule/staff/audit
```

The experience is light-first, mobile-aware, and designed so the next action is always clear. Role switching and event switching are persistent but never grant access.

### Important screens/modules

- Landing/auth/verification/reset.
- Event directory and introduction.
- Role selection.
- Participant overview, registration, team, challenge, schedule, profile.
- Volunteer overview, room, teams, verification, schedule, profile.
- Coordinator overview, rooms/room detail, teams/team detail, schools, volunteers, schedule.
- Principal overview, events/event editor, participants, schools, teams, rooms, volunteers, coordinators, schedule, settings, audit, profile.
- Invitation acceptance and offline fallback.

### How users interact

- Server-rendered pages with focused client interactions (forms, dialogs, search, copy, mobile navigation).
- Real database records for every operational action.
- Clear loading/empty/error/success/permission states.
- Mobile bottom navigation for participant/volunteer; drawer/sheet navigation for coordinator/principal.
- Copy actions for the challenge and AI context; no integrated chatbot.

---

## 7. Features and Functional Capabilities

Status labels: **MVP** = essential for the hackathon demo; **Supporting** = valuable if time permits; **Future** = not in the MVP.

### 7.1 Authentication and profiles

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Email/password auth | Signup, login, logout | One identity for all roles | Supabase Auth | Fragmented accounts | MVP |
| Email verification | Confirms ownership | Trust, reduced fake accounts | Supabase email + Resend SMTP | Unverified participants | MVP |
| Password reset | Recovery | Usability | Supabase recovery flow | Lockouts | MVP |
| Profile | Name, phone, avatar/initials | Shared identity across events | `profiles` + trigger | Repeated data entry | MVP |
| Role-aware entry | Shows only assigned roles | Prevent self-elevation | `event_memberships` + guards | Unclear access | MVP |

### 7.2 Event discovery and lifecycle

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Event directory | Lists published events | One entry point | `events` query + RLS | Scattered announcements | MVP |
| Event introduction | Dates/venue/status/description | Context before entering | Event record | Unclear event details | MVP |
| Event lifecycle | Draft → published → registration → live → completed → archived | Operational control | Status enum + validated transitions | Ad-hoc event state | MVP |
| Event creation | Principal creates a new event | Extensibility beyond Xplorer | `create_event` RPC + editor | Rebuilding per event | MVP |
| Event settings | Team sizes, capacity, registration window | Configurable rules | Typed columns | Hardcoded event rules | MVP |
| Announcements | Audience-specific notices | Operational communication | `event_announcements` | Lost updates | Supporting |

### 7.3 Participant registration and teams

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Registration | Collects school/student/contact data | Event eligibility | `event_registrations` + capacity check | Duplicate/missing registrations | MVP |
| Team creation | Participant creates a team | Team-based event | `create_team` RPC | Manual team lists | MVP |
| Invitations | Invite registered participants | Self-service teams | Hashed token + in-app invite | Coordination overhead | MVP |
| Accept/decline/revoke/expire | Full invitation lifecycle | Trust and control | Invitation RPCs + status | Stale/duplicate invites | MVP |
| Team size rules | Min 2/max 5 for Xplorer | Fairness/eligibility | Event config + DB invariant | Overfilled teams | MVP |
| Team workspace | Roster, leader, size meter | Shared clarity | Team/member tables | Team confusion | MVP |
| Leadership transfer/removal | Manage team changes | Real-world necessity | Transactional RPC | Orphaned teams | Supporting (policy pending) |

### 7.4 Challenge and schedule

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Problem statement | Structured challenge reading | Core participant content | `event_challenges` JSON sections | PDF/image friction | MVP |
| Copy statement | Copies complete text | Use in docs/tools | Server-generated text + clipboard | Manual copying | MVP |
| Copy AI context | Copies prepared prompt | Helps participants use external AI | Generated from stored content | Blank-page problem | MVP |
| Schedule | Date tabs + timeline | Know what/where/when | `schedule_items` + IST | Printed/static schedule | MVP |
| Now/next | Highlights current/upcoming | Orientation during event | Time comparison | Missed activities | MVP |
| Schedule management | Principal CRUD/reorder/publish | Changes happen | Admin RPCs/actions | Static PDF edits | MVP |

### 7.5 Volunteer operations

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Assigned room | Shows only the volunteer’s room | Least privilege | `volunteer_assignments` | Broad list exposure | MVP |
| Room roster | Teams/members/check-in status | Operational clarity | Scoped RPC/RLS | Manual lists | MVP |
| Participant search | Name/email/phone/team, room-scoped | Fast verification | Scoped search RPC | Slow manual lookup | MVP |
| Check-in | Records attendance with timestamp/volunteer | Accountability | `record_check_in` RPC | Paper/no record | MVP |
| Duplicate prevention | One verified check-in | Data integrity | Partial unique index | Double entry | MVP |
| Flag unregistered/ambiguous | Records exception without creating account | Safety | Append-only check-in attempts | “Just mark present” | MVP |
| Room status | Setup/active/full/closed/issue | Operational signal | RPC + audit | Stale room info | MVP |

### 7.6 Coordinator and principal operations

| Feature | What it does | Why | How | Problem solved | Status |
|---|---|---|---|---|---|
| Coordinator dashboard | Authorized rooms and exceptions | Supervision | Scoped queries/RLS | No operational picture | MVP |
| Drill-down | Room → team → school → participant | Root-cause/context | Breadcrumb + scoped data | Disconnected views | MVP |
| Principal overview | Event health/lifecycle | Governance | Aggregates + status | No single view | MVP |
| Rooms/teams/schools/volunteers | Configuration/oversight | Run the event | Admin CRUD/assignments | Manual coordination | MVP |
| Schedule editor | Create/edit/publish | Keep event current | Server actions | PDF lock-in | MVP |
| Role assignment | Grant/revoke staff roles by email | Delegation | Membership RPC + audit | Broad shared access | MVP |
| Audit log | Records sensitive changes | Accountability | Append-only `audit_logs` | No history | MVP |
| Announcements | Audience-specific updates | Communication | DB + audience policy | Lost messages | Supporting |

### 7.7 Platform and experience

| Feature | What it does | Why | How | Status |
|---|---|---|---|---|
| Light-first design system | Consistent premium UI | Trust/usability | Tokens + components | MVP |
| Responsive layouts | Phone/tablet/desktop | Field use | Mobile-first grids/nav | MVP |
| PWA | Installable, offline fallback | Event-day convenience | Manifest + service worker | MVP |
| Accessibility | Keyboard/contrast/semantics | Inclusive use | WCAG 2.2 AA targets | MVP |
| Audit/privacy boundaries | Scoped data | Institutional trust | RLS + fields + logging rules | MVP |
| QR check-in | Fast scanning | Future | QR + scanner | Future |
| Realtime dashboards | Live updates | Future | Supabase Realtime | Future |
| Offline check-in | No connectivity | Future | Local queue + conflict resolution | Future |
| Certificates/reports | Post-event value | Future | Templates/exports | Future |
| Multi-campus | Institution expansion | Future | Tenancy model | Future |

### What is explicitly not built

Payments, ticketing, native apps, public anonymous registration, AI chat, equipment inventory, certificate generation, attendance analytics beyond operational counts, real-time updates, and offline check-in. These are roadmap items, not hidden claims.

---

## 8. Technical Concept and Feasibility

### Proposed technical approach (decisions from the brief)

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS.
- **Backend:** Supabase (Auth, PostgreSQL, Storage).
- **Authorization:** Supabase RLS + server-side guards + RPC invariants.
- **Email:** Resend via Supabase SMTP for auth; Resend API (server-only) for application email if included.
- **Hosting:** Vercel free tier.
- **PWA:** manifest, icons, standalone display, safe offline fallback.
- **Source control:** GitHub.

**Planning candidates (not installed):** Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, `@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7, Zod 4.6.7, Lucide 1.66.0. Pin and verify at implementation.

### Frontend architecture

- Server Components for authenticated reads; client islands for forms, dialogs, search, copy, and mobile nav.
- Shared domain modules for auth, events, teams, operations, validation.
- shadcn/ui + Radix + Lucide; one component system; CSS-only motion.
- App shell with role-aware navigation; mobile bottom nav for participant/volunteer, drawer/sheet for coordinator/principal.
- No client-side role trust; the URL role is re-validated.

### Backend and data architecture

Normalized, event-scoped schema. Core entities:

- `profiles` (identity), `events`, `event_memberships` (roles), `event_schools`.
- `event_registrations`, `teams`, `team_members`, `team_invitations`.
- `rooms`, `room_assignments`, `volunteer_assignments`, `coordinator_assignments`.
- `check_ins`, `schedule_items`, `event_challenges`, `event_announcements`, `audit_logs`.

Key decisions:

- No global role column; memberships are the authority.
- No separate `participants` table; profile + registration + membership.
- No separate `schedules` parent; one schedule per event.
- No `event_settings` key-value table; typed event columns.
- Composite foreign keys keep child records in the same event.
- Sensitive writes use `SECURITY DEFINER` RPCs with locks/checks; direct writes revoked.
- Audit triggers for role, event, assignment, and check-in changes.

### Authentication and authorization flow

Supabase Auth handles credentials, verification, reset, and sessions. Middleware/proxy refreshes sessions. Server guards check membership/role/scope. RLS re-checks at the database. Role selection only reads memberships; it never writes a role. A participant cannot become staff by editing a URL, cookie, hidden field, or API request.

### AI/ML capabilities

**No integrated AI/ML feature is planned.** The product provides a **“Copy AI Context”** action: a prepared prompt generated from the stored problem statement, event context, team-size rules, and evaluation criteria. Participants can paste it into their own AI tools. This is deliberately not an API integration, chatbot, or model-dependent workflow. It avoids API keys, cost, latency, and unverified AI output inside the product.

### External integrations

- Supabase Auth/Postgres/Storage.
- Resend SMTP/API.
- Vercel hosting/domain/TLS.
- BigRock DNS (`shaikaakif.com`).
- Optional future: GitHub, calendar exports, QR, analytics, email reminders.

### Data flow (conceptual)

```
User action → Next.js Server Action → Zod validation → auth/role/scope guard
            → Supabase RPC/table write → RLS/constraints/triggers → audit
            → revalidate → Server Component read → scoped UI
```

### Technical challenges

1. **RLS correctness and recursion.** Helper functions must be carefully designed, indexed, and tested with real JWTs.
2. **Event-scoped authorization.** Every query/RPC must include event and room/team scope; IDOR is the main risk.
3. **Team capacity concurrency.** Last-slot acceptance needs a row lock/transaction.
4. **Invitation security.** Token hashing, expiry, single-use, email binding, no logging.
5. **PWA caching.** Must not cache authenticated/operational data; offline fallback only.
6. **Schedule fidelity.** Preserve exact/approximate source times; no invention.
7. **Email deliverability.** DNS/Resend configuration is an external dependency.
8. **Scope discipline.** Admin features can balloon; the demo path must stay prioritized.
9. **Content/assets.** The full challenge and brand assets are missing.
10. **Testing environment.** Docker is not installed; local Supabase may require a hosted dev project or Docker approval.

### Feasibility assessment

**Feasible for a hackathon MVP** if scope is held to the four-role vertical slice, synthetic data, one event configuration, and the security-critical flows. The architecture uses managed services and avoids a separate backend. The riskiest areas are RLS, content/assets, demo data capacity, and time. The plan deliberately excludes realtime, offline check-in, QR, certificates, and multi-campus.

### Potential limitations

- Single-institution assumption; no tenant model yet.
- No real-time updates; dashboards refresh on navigation.
- No offline operational writes.
- No formal penetration test or accessibility certification.
- Email depends on external DNS/deliverability.
- Demo data is synthetic; impact metrics are not measured.
- The MVP is not a full ERP.

---

## 9. Innovation and Differentiation

### What makes the concept distinctive

1. **Event-scoped multi-role identity.** A person can be a participant in Xplorer and a volunteer in Sports Day without a global role flag. This is more realistic than a single “admin/student” switch and demonstrates strong domain modeling.
2. **The operational chain as the interface.** Coordinator → Room → Team → School → Participant mirrors how events are actually run; it is more useful than a wall of charts.
3. **Least-privilege field workflow.** A volunteer sees only their room and can verify/check in without a full participant directory. This is a genuine privacy/security design choice, not a hidden button.
4. **Reusable event configuration.** Xplorer is data, not code. The same product can host Annual Day, Sports Day, workshops, and competitions.
5. **AI-ready, not AI-dependent.** The copyable AI context helps participants without embedding an unverified model or exposing API keys.
6. **Institutional design language.** A light, editorial “expedition field guide” system with Gatik/Xplorer identity is more specific than a generic dark SaaS dashboard.
7. **Honest operational integrity.** Duplicate team/check-in prevention, audit logs, and flagged exceptions are product features, not just backend details.

### Existing approaches and their limitations

Generic event platforms focus on tickets/agenda, not campus teams/rooms/volunteers/schools. Forms + spreadsheets are flexible but lack authorization, integrity, and audit. College ERPs are broad but not event-operational. A one-off hackathon site is tailored but not reusable. Gatik Events sits in the gap: focused enough to run a real event, structured enough to reuse, secure enough to trust with participant data.

### Technical or operational innovation

- Event-scoped RBAC with room-level volunteer/coordinator scopes.
- Database-enforced team/invitation/check-in invariants.
- A structured schedule that preserves official times and approximate notes rather than flattening a PDF.
- AI context generated from the same source as the challenge.
- A PWA delivery model with an explicit “no sensitive cache” policy.

### Why the solution could be valuable compared with alternatives

It gives the institution a **reusable operating layer** rather than a one-off page, while keeping the participant/volunteer experience simple. The value is not “more features”; it is fewer coordination gaps, clearer accountability, and safer data access.

### Claims to avoid

Do not say “first-ever,” “world’s first,” “revolutionary,” “fully secure,” “fully accessible,” “production-ready,” or “used by X students” without evidence. The honest claim is: **a working, event-scoped MVP with a credible path to reuse.**

---

## 10. Impact and Value Proposition

### Who benefits

- **Participants:** one place to register, form a team, read the challenge, and follow the schedule; fewer “where do I go?” moments.
- **Volunteers:** a fast, scoped verification flow; less manual list hunting; a clear record of what they did.
- **Coordinators:** operational visibility and drill-down; faster exception handling.
- **Principals:** event-level control, role accountability, and a reusable configuration.
- **Institution:** less duplicated effort, better privacy boundaries, and institutional memory across events.

### Expected impact (hypotheses, not measured claims)

- Fewer duplicate/missing registrations.
- Faster participant verification/check-in.
- Fewer room/team allocation errors.
- Reduced broad sharing of participant lists.
- Less setup time for the next event.
- Better participant confidence in schedule/logistics.

### Potential measurable outcomes

If instrumented later:

- registration completion rate;
- duplicate registration/team attempts prevented;
- average check-in time per participant;
- percentage of participants verified in the correct room;
- number of flagged/unregistered cases resolved;
- staff time to configure a new event;
- participant satisfaction/support questions.

**No baselines or impact statistics have been measured. Do not invent them.**

### How impact could be validated

- Pilot at Xplorer 2026 with synthetic/demo data first, then a controlled real event with institutional approval.
- Compare operational logs/time-to-check-in against the previous manual process.
- Interview volunteers/coordinators after the event.
- Track exception types and resolution time.
- Review privacy/access incidents.

### Long-term value

A reusable campus activity platform can become institutional infrastructure: consistent registration, role delegation, operational records, and event history. The value grows with each event because configuration and operational knowledge accumulate rather than being rebuilt.

---

## 11. Business and Scalability Potential

### Adoption potential

The first adopter is Gatik Junior College. The natural expansion path is within the institution (Annual Day, Sports Day, exhibitions, workshops, club activities), then to other colleges/universities with similar event operations. Adoption depends on trust, ease of setup, and integration with existing institutional processes.

### Sustainability model (possibilities, not commitments)

- Institution-owned/internal tool (no per-event fee).
- SaaS subscription per institution/event tier.
- Setup/configuration services for large events.
- Premium modules: QR check-in, certificates, analytics, multi-campus.
- Sponsorship/partnership with event organizers.

No pricing, revenue, or market-size claims are made. The hackathon MVP is not a validated business.

### Expansion opportunities

- Multi-campus/institution tenancy.
- Event templates and reusable room/schedule presets.
- Public event pages and external registration.
- QR/contactless check-in.
- Certificates and participation records.
- Equipment/inventory allocation.
- Volunteer scheduling/shifts.
- Integration with email/calendar/WhatsApp notifications.
- Analytics for participation and operations.
- Accessibility/localization for diverse campuses.

### Partnerships

Potential future partners: colleges, event organizers, student councils, education technology providers, sponsor organizations. None are confirmed.

### Scalability

The schema is event-scoped and indexed for the MVP scale. Multi-institution growth requires an explicit tenant model, not just more rows. Operational realtime/offline features require additional architecture. The plan is honest about these steps rather than claiming unlimited scale.

### Long-term product vision

A trusted campus activity operating system: any institution can create an event, define roles/rooms/teams/schedule, run it with scoped staff, verify participation, and retain a clean operational history — without rebuilding tools each time.

---

## 12. Demo and Judge Experience

### What judges should understand first

1. The problem is real and operational, not hypothetical.
2. The product has one coherent architecture across four roles.
3. Xplorer is a database configuration, not a hardcoded demo.
4. Security/role boundaries are visible in the workflow.
5. The team knows what is built, what is not, and what comes next.

### Problem-to-solution narrative

Open with the fragmented-tools problem (WhatsApp, forms, spreadsheets, paper). Show the event directory and role selection to establish one system and earned access. Move through participant → volunteer → coordinator → principal to prove the operational chain. Close with event creation/extensibility and the security model.

### Main user journey to demonstrate

**Participant registers/team/challenge/schedule → Volunteer verifies in a room → Coordinator sees the check-in via drill-down → Principal edits schedule/assigns staff.** This is the strongest end-to-end story and maps directly to the judging criteria.

### Most impressive capabilities to showcase

- Role selection driven by event memberships, with URL tampering denied.
- Room-scoped volunteer search and check-in (privacy + operational speed).
- Coordinator drill-down Room → Team → School → Participant.
- Exact structured schedule from the official PDF, including honest approximate notes.
- Principal event administration with audit.
- Event creation proving extensibility.
- Real database persistence, not mocked state.

### Evidence that would make the demonstration convincing

- Live flow on the deployed URL.
- A short “attempt to access another role/room” that fails safely.
- Database/ERD view showing event-scoped memberships and constraints.
- Exact schedule mapping to the source PDF.
- Test/RLS results (actual, with commands).
- Responsive screenshots at mobile/desktop widths.
- Demo reset/seed showing 6 rooms/12 teams and scoped staff.

### Potential demo limitations

- Synthetic data only; no real participants.
- No realtime; a refresh may be needed to see cross-role updates.
- No offline check-in; venue connectivity required.
- Email delivery may be slow; pre-verified demo accounts avoid dependence.
- Challenge content/assets may be incomplete; do not invent.
- Demo time may require cutting optional admin screens.

### What should be visible during the demonstration

- The event directory and role selection.
- Participant team/challenge/schedule.
- Volunteer room/search/check-in/flag outcome.
- Coordinator room board and drill-down.
- Principal lifecycle/schedule/room/staff action + audit.
- A clear architecture/security summary at the end.

---

## 13. Presentation and Pitch Intelligence

### Central narrative

**“Campus events are run across disconnected tools, so the institution loses time, trust, and data control. Gatik Events gives every role one event-scoped system — from registration to check-in — and makes Xplorer 2026 the first proof, not the product’s limit.”**

### The problem–solution relationship

- Problem: fragmented tools + broad access + manual verification + repeated setup.
- Solution: one event directory + event-scoped roles + structured teams/rooms/schedule + scoped field verification + reusable administration.
- Proof: the four-role live workflow.
- Future: more events, QR/realtime/offline, multi-campus.

### Most important information to communicate

1. Who the four roles are and what each needs.
2. Why event-scoped roles are the core architectural idea.
3. How the operational chain works (Room → Team → School → Participant).
4. That Xplorer is data, not hardcoded.
5. That security/privacy are enforced server-side and in the database.
6. What is actually working vs planned.

### Potential opening ideas

- “A 24-hour hackathon has six rooms, twelve teams, multiple schools, and a schedule that changes. Where does the truth live?”
- “The event is not the hard part. The coordination is.”
- Show a simple comparison: WhatsApp + spreadsheet + paper vs one event workspace.

### Potential closing ideas

- “Xplorer 2026 is Chapter 4. Gatik Events is the platform for Chapter 5, Annual Day, Sports Day, and everything after.”
- “One campus. Every activity. One source of truth.”
- “We didn’t just build an event page. We built the role model an institution can reuse.”

### Technical concepts requiring diagrams

- System architecture: browser/PWA → Next.js/Vercel → Supabase Auth/Postgres/Storage → Resend.
- Auth flow: signup → verify → session → event → role → dashboard.
- Authorization flow: request → membership → role/scope → RLS → render.
- ER diagram: profiles/events/memberships/schools/registrations/teams/rooms/check-ins.
- Operational hierarchy: Coordinator → Room → Team → School → Participant.
- Event lifecycle: draft → published → registration → live → completed → archived.
- Data flow for check-in: volunteer search → scoped RPC → confirmation → check-in/flag → coordinator view.
- PWA cache boundary: static assets vs no sensitive data.

### Opportunities for infographics/comparisons

- “Before vs after” workflow comparison (tools vs one platform).
- Four-role responsibility map.
- Room/team/volunteer allocation diagram (6 rooms, 2 teams each).
- Event lifecycle stepper.
- Security layers (server guard + RLS + RPC + audit).
- MVP vs roadmap matrix.
- Judging-criteria alignment table.

### Potential evidence and metrics to include

**Available evidence (when built/tested):** live demo, test results, RLS checks, responsive screenshots, exact schedule mapping, seeded data counts.

**Do not include without measurement:** time saved, percentage reduction in duplicates, user satisfaction, adoption, revenue, “X participants served.” These are hypotheses.

### Judging criteria the pitch should address

- **Problem understanding:** real Xplorer operations, four roles, concrete pain points.
- **UX/UI:** live screens, mobile flows, design system, accessibility.
- **Data/domain modeling:** event-scoped schema, constraints, ERD, RLS.
- **Solution approach/execution:** working vertical slice, architecture, trade-offs, honest scope.
- **Working demo:** end-to-end flow on production with synthetic data.
- **Innovation/extensibility:** multi-event model, AI context, roadmap.

### Slide-deck guidance (for a future presentation agent, not created here)

- Start with the operational problem, not the tech stack.
- Use one strong product visual per role, not a wall of screenshots.
- Show the architecture and role model early enough to prove it is not a mockup.
- Use a “what works / what’s next” slide to build trust.
- Keep the demo as the centerpiece; slides support, not replace, the live flow.
- Avoid generic AI gradients, fake logos, and unverified metrics.

---

## 14. Assumptions, Unknowns and Limitations

### Unverified assumptions

- The institution will reuse the platform for multiple event types.
- A single institution is the initial deployment; no tenant model is needed for the MVP.
- Participants/volunteers will use mobile web/PWA under event conditions.
- Principals want self-service event configuration.
- Event teams may include members from different schools (schema does not enforce same-school membership).
- One verified check-in per participant per event is the right rule.
- The demo can use pre-verified synthetic accounts and synthetic teams.
- A principal of any event may create a new event (single-institution assumption).

### Missing research

- No user interviews, surveys, or observation of the current Xplorer operation.
- No baseline for registration/check-in time, duplicate rates, or staff workload.
- No accessibility testing with real users with disabilities.
- No institutional privacy/legal review.
- No competitor analysis beyond general categories.
- No venue/network/device constraints for the demo.

### Technical uncertainties

- Supabase RLS helper performance/recursion at scale.
- Email deliverability/DNS verification timing.
- Next.js 16/Tailwind 4/shadcn compatibility at implementation time.
- Local Supabase testing without Docker.
- PWA behavior across iOS/Android/browser versions.
- File upload/storage policy details if posters/avatars are implemented.
- Free-tier limits on Vercel/Supabase during the demo.

### Product limitations

- No realtime updates.
- No offline check-in.
- No QR scanning.
- No certificates, payments, inventory, or advanced analytics.
- No multi-campus tenancy.
- No formal audit export.
- No integrated AI model (only copyable context).
- Team leadership/removal policy not finalized.
- Minor/guardian consent policy not finalized.

### Questions requiring team decisions

- Official hackathon name/theme/brief and demo constraints.
- Full problem statement content.
- Brand assets/usage rights.
- Subdomain and DNS owner.
- Resend sender/domain verification.
- Shared staff dashboard password vs per-account credentials.
- Same-school team rule.
- School self-service vs principal-managed list.
- Event creation authority.
- Coordinator all-room default vs explicit.
- Check-in frequency.
- Waitlist behavior.
- Team leadership/removal rules.
- Data retention/minor policy.

### Claims that must not be made without evidence

- “Fully secure,” “production-ready,” “fully accessible,” “WCAG compliant,” “penetration-tested.”
- “First-ever,” “world’s first,” “revolutionary,” “AI-powered” (the product does not integrate AI).
- “Used by X students/schools,” “saved X hours,” “reduced duplicates by X%.”
- “Real-time,” “offline check-in,” “QR check-in,” “multi-campus” as if implemented.
- “Integrated with [institution system]” unless actually integrated.
- “Official Xplorer platform” unless the institution authorizes that claim.

---

## 15. Future Possibilities

### Features beyond the hackathon MVP

- QR/contactless check-in and printable team passes.
- Realtime room/check-in dashboards with scoped channels.
- Safe offline check-in with conflict resolution and audit.
- Certificates and participation records.
- Equipment/inventory allocation.
- Volunteer shifts and availability.
- Advanced analytics and reports.
- Schedule change notifications and reminders.
- Public event pages and external registration.
- Event templates and reusable presets.
- Multi-campus/institution tenancy.
- Calendar/email/WhatsApp integrations.
- Accessibility/localization expansions.
- Parent/guardian consent workflows for minors.

### Potential integrations

- Institution SSO/Google Workspace/Microsoft Entra (future).
- Calendar exports (ICS).
- Email/Resend templates.
- QR scanners via PWA camera (with permissions).
- Analytics/consent-aware dashboards.
- Payment/ticketing only if the event model requires it.

### Expansion opportunities

Start with Gatik’s events, then other colleges/universities; expand from hackathons to annual days, sports, exhibitions, cultural festivals, workshops, and club activities. The event-scoped model is the reusable core.

### Long-term vision

Become the institution’s trusted campus activity operating layer: one place to create, coordinate, verify, and learn from every activity — with role-appropriate access and a clean operational record.

### What the project could become after the competition

- A pilot with real institutional approval and privacy review.
- A reusable template for other departments/colleges.
- A portfolio-grade full-stack product with tested RLS, PWA, and operational analytics.
- A foundation for multi-campus SaaS, if adoption and demand justify it.

---

## Appendix A — Source and evidence notes

**Sources used for this document**

1. `gatik-product-spec.md` — supplied master product requirements and technical specification (the primary product source).
2. `AI_ENGINEERING_CONSTITUTION.md` and `MASTER_AI_ENGINEERING_SOP.md` — engineering standards present in the workspace.
3. `master-ui-skill.md` — design constitution/process; the skill was loaded during planning.
4. Official Xplorer schedule PDF (`EVENT SCHEDULE XPLORER'26 QR .pdf`) — located in Downloads, visually verified (3 pages; image-based). The schedule items in the product spec were checked against it.
5. Current workspace inspection — no app, package manifest, Git repo, Supabase setup, tests, or PWA configuration exists.

**What was verified**

- Schedule content and approximate notes.
- Workspace/document inventory.
- Installed tool versions (Node, npm, pnpm, Supabase CLI, Vercel CLI); Docker and GitHub CLI absent.
- Current package registry versions (candidates, not installed).

**What was not verified**

- Official hackathon brief/name/theme.
- Full problem statement content.
- Brand assets/rights.
- Real user needs through interviews.
- Any implemented feature, deployment, test, or impact metric.

---

## Appendix B — Glossary

| Term | Meaning in this project |
|---|---|
| **Event** | A configured campus activity (Xplorer, Annual Day, etc.) with dates, venue, settings, roles, rooms, schedule, and participants |
| **Event membership** | A user’s active role grant for one event; the authority source |
| **Participant** | A user with a confirmed event registration and participant membership |
| **Volunteer** | A user assigned to run a specific room; scoped access |
| **Activity Coordinator** | A user supervising assigned rooms or all rooms |
| **Principal** | Event administrator with event-wide authority; may create events (MVP assumption) |
| **Registration** | Event-specific participant data/eligibility record |
| **Team** | A group of 2–5 participants for a team-based event |
| **Room assignment** | The link between a team and a room |
| **Volunteer assignment** | The link between a volunteer and a room |
| **Check-in** | An append-only verification outcome; `verified` is positive attendance |
| **Challenge** | The structured problem statement for a hackathon-style event |
| **AI context** | A copyable prompt generated from the stored challenge; not an integrated AI feature |
| **RLS** | Postgres Row Level Security; database-enforced access control |
| **RPC** | A Postgres function called from the server for sensitive/transactional operations |
| **PWA** | Progressive Web App; installable web experience with a safe offline fallback |

---

**End of PROJECT_CONTEXT.md**
