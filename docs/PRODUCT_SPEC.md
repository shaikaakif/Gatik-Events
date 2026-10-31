# Historical Product Specification

> **HISTORICAL:** Superseded by `GATIK_EVENTS_MASTER_PROJECT.md`.

**Status:** Planning only. No application code exists yet.
**Version:** 1.0 (31 October 2026)
**Source of truth for:** product vision, scope, roles, event rules, schedule seed content, and acceptance scenarios.
**Related:** [System architecture](SYSTEM_ARCHITECTURE.md) · [Database schema](DATABASE_SCHEMA.md) · [RBAC matrix](RBAC_PERMISSION_MATRIX.md) · [User flows](USER_FLOWS.md) · [Design](DESIGN.md) · [Roadmap](IMPLEMENTATION_ROADMAP.md) · [Open questions](OPEN_QUESTIONS.md)

---

## 1. Product identity

**Name:** Gatik Events
**Category:** Campus Activity Management Platform
**First configured event:** Gatik Xplorer 2026 — Chapter 4
**Institution:** Gatik Junior College, The Bodhi Tree Campus, Bhanur, Telangana, India
**Product format:** Responsive, installable web application (PWA)

### Vision

One authentication system, one event directory, one operational database, and four role-specific experiences for the full life of a campus activity — from event creation and registration through teams, rooms, schedules, check-in, and administration.

Xplorer 2026 is the first real event configuration, not the product boundary. Annual Day, Sports Day, science exhibitions, cultural festivals, workshops, inter-college competitions, and club activities must be addable as new event records without building a separate application.

### Product principles

1. **Database truth.** Directories, roles, teams, rooms, check-ins, and schedules come from Supabase records, not hardcoded screens.
2. **Event-scoped authority.** Every operational record belongs to an event. Roles are event memberships, never a single global role column.
3. **Earned access.** Selecting a role in the UI never grants it. Server checks and Row Level Security (RLS) remain authoritative.
4. **Operational clarity.** A coordinator can move from room to team to school to participant without losing context.
5. **Mobile field use.** Participant and volunteer journeys are designed for phones first; administrator views adapt deliberately.
6. **Calm institutional design.** Light-first, premium, legible, and specific to Gatik/Xplorer — not a dark developer dashboard or generic AI template.

---

## 2. Confirmed decisions

| Area | Decision |
|---|---|
| Authentication | Supabase Auth (email + password, verification, reset) |
| Transactional auth email | Resend through Supabase SMTP |
| Database | Supabase PostgreSQL with RLS |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Hosting | Vercel free tier |
| Source control | GitHub (repository not yet initialized) |
| Domain | Subdomain of `shaikaakif.com`; proposed `events.shaikaakif.com`, awaiting approval |
| PWA | Manifest, icons, standalone display, safe offline fallback |
| Entry flow | Authentication → event directory → event → authorized role → dashboard |
| Team registration | Participant creates a team; invites existing registered participants |
| Theme | Light-first |
| First event | Xplorer 2026 — Chapter 4, seeded through the database |
| Team size | Xplorer: minimum 2, maximum 5; event-configurable |
| Initial operations | 6 rooms, 12 teams, 2 teams per room, 1 volunteer per room; configurable |
| Timezone | `Asia/Kolkata` |

---

## 3. Users and role responsibilities

Four event-scoped roles. A user may hold several roles in the same event and switch between them.

| Role | Job to be done | Scope |
|---|---|---|
| **Participant** | Register, form a team, understand the challenge, follow the schedule | Own registration, own team, published event content |
| **Volunteer** | Run an assigned room; verify participants; record check-ins; report issues | Only assigned room(s) and the teams in them |
| **Activity Coordinator** | Supervise operations across authorized rooms and drill into teams/schools | Assigned rooms or all rooms, depending on assignment |
| **Principal / Event Administrator** | Own the event: lifecycle, settings, rooms, schedule, staff roles, participation oversight | Entire event; event creation for authorized principals |

Full permission details: [RBAC_PERMISSION_MATRIX.md](RBAC_PERMISSION_MATRIX.md).

---

## 4. End-to-end product flow

```
Landing / sign in
      ↓
Supabase Auth (signup, verify email, login, reset, logout)
      ↓
Event directory (published events from database)
      ↓
Event introduction (dates, venue, status, description)
      ↓
Role selection (only active event memberships)
      ↓
Role-specific dashboard
      ↓
Event schedule / profile / role switching / event switching
```

A user with no membership in an event may be offered **Register as participant** when registration is open. Staff roles are visible only after a principal assigns an active event membership.

---

## 5. Event directory and event introduction

### Directory

- Loaded from `events`, filtered by status and visibility.
- Search by title; category filter chips; one card per event.
- Each card: event title, category, dates, venue, status, short description, poster or typographic event mark, and the viewer's authorized roles.
- Xplorer is seeded, not hardcoded. Additional published events appear automatically.

### Event introduction

- Event title, dates, venue, description, schedule preview.
- Status and registration window.
- "Your access" panel: authorized roles, or a participant registration call to action.
- Principal-only controls (edit, publish, manage) never appear for other roles.
- Draft events are visible only to principals of that event.

### Status versus live phase

`events.status` is an operational lifecycle value (`draft`, `published`, `registration_open`, `registration_closed`, `in_progress`, `completed`, `archived`). The **live/upcoming/completed badge** is derived from `starts_on`/`ends_on` in `Asia/Kolkata`. This lets the demo event be live by date while late registration remains open, without falsifying the schedule or lifecycle.

---

## 6. Participant experience

Navigation: **Overview · My Team · Problem Statement · Event Schedule · Profile**.

### 6.1 Registration

Required profile/registration data:

- Full name (from profile, editable).
- Phone number.
- School/college (selected from schools registered for the event).
- Grade/year or equivalent student level.
- Optional roll number and event-specific responses.
- Email comes from the authenticated account and is not re-entered.
- Confirmation of participation.

Rules:

- One active registration per user per event (`unique(event_id, user_id)`).
- Registration only when the event is `registration_open`, within the registration window, and capacity remains.
- Registration creates an active participant membership if one does not exist.
- Duplicate registration is rejected with a clear message.
- A user who is staff in one event can register as a participant in another (or the same, subject to role rules).

### 6.2 Overview

- Greeting, event identity, live/upcoming status.
- Registration status and team status.
- "Your trail" progress: Account → Registered → Team formed → Checked in.
- Next scheduled activity from `schedule_items`.
- Team snapshot with roster count.
- Published announcements relevant to participants.
- Quick actions: view team, open challenge, copy AI context, view schedule.

### 6.3 My Team

- Team name, team code, school, description, leader.
- Roster with leader badge; team-size meter against event limits.
- Create team if not in one and registration is confirmed.
- Invite an existing registered participant by email.
- Pending invitations: resend/revoke for leader; accept/decline for invitee.
- Leave team; leader transfer/removal rules (see open questions for final policy).
- No duplicate membership in a team for the same event.

### 6.4 Problem Statement

Dedicated reading experience with:

1. Challenge title.
2. The Challenge.
3. Your Challenge.
4. Minimum Expected Outcome.
5. Think Beyond the MVP.
6. Evaluation Criteria.

The source content must be stored in the database. It must not be embedded as an image or PDF. Copy actions:

- **Copy Problem Statement** — complete formatted statement.
- **Copy AI Context** — a prepared prompt generated server-side from the stored statement plus event context, team-size context, and evaluation criteria.

Both actions show a visible, accessible success state. No content may be invented to fill missing sections; incomplete content is flagged as unpublished or a content blocker.

### 6.5 Event Schedule

- Date selection for 31 October and 1 November 2026.
- Vertical timeline: time, title, description, location where supplied, sequence.
- "Now"/"Next" indication in `Asia/Kolkata`.
- Logistics notes displayed without inventing timestamps.
- The PDF is a source document, not the final experience.

### 6.6 Profile

- View/edit full name, phone, avatar (optional).
- Email read-only with verification status.
- School/student details via event registration.
- Team membership and event participation.
- Sign out.
- Privacy note explaining who can see contact details.

---

## 7. Volunteer experience

Navigation: **Overview · My Room · Teams · Participant Verification · Event Schedule · Profile**.

### 7.1 Scope

A volunteer sees only active room assignments. Default Xplorer configuration: one volunteer per room. A volunteer cannot list, search, or check in participants from an unrelated room.

### 7.2 Overview

- Assigned room and operational status.
- Assigned teams and participant count.
- Verified / pending / flagged counts.
- Recent check-ins by this volunteer.
- Large "Verify participant" action.
- Alerts: unassigned team, incomplete roster, flagged record, room issue.

### 7.3 My Room

- Room name/code, location, capacity, current status.
- Assigned teams (default two) with school, member count, and check-in progress.
- Team member list with registration and check-in status.
- Update operational status (`setup`, `active`, `full`, `closed`, `issue`) with a note; changes are audited.

### 7.4 Participant Verification

1. Open assigned room.
2. Search by name, registered email, phone, or team name.
3. Results are limited to participants whose teams are assigned to that room.
4. Select the correct person; review name, team, school, registration status, and existing check-in.
5. Confirm and record check-in with timestamp and volunteer identity.
6. Outcomes: `verified`, `unregistered`, `already checked in`, `ambiguous`, `flagged`.
7. Unregistered/ambiguous people are recorded as a flagged operational attempt; the system does **not** create a participant account or registration.
8. Duplicate verified check-ins are prevented.

Search is a server-side, scoped RPC; it does not expose the full event roster.

---

## 8. Coordinator experience

Navigation: **Overview · Rooms · Teams · Schools · Volunteers · Event Schedule · Profile**.

Hierarchy: **Coordinator → Room → Team → School → Participants**.

### 8.1 Scope

- A coordinator assignment may cover specific rooms or all rooms (`room_id = null`).
- Default seed: one coordinator for all rooms, one coordinator for rooms 1–3, to demonstrate scoping.
- Cannot see rooms outside the assignment.

### 8.2 Overview

- Real counts: rooms, teams, schools, participants, verified participants, pending registrations, active volunteers.
- Exceptions: unassigned rooms, teams without a room, incomplete teams, flagged check-ins, rooms with an issue.
- Operational room board rather than an undifferentiated card grid.

### 8.3 Drill-down

- Rooms list → room detail → team detail → school and participant context.
- Check-in status visible from room and team levels.
- Volunteer assignment and activity visible for authorized rooms.
- Every count must be derived from the database; no decorative or fabricated statistics.

---

## 9. Principal experience

Navigation: **Overview · Events · Participants · Schools · Teams · Rooms · Volunteers · Coordinators · Event Schedule · Settings · Profile**.

### 9.1 Overview

- Event lifecycle and current phase.
- Registrations, confirmed participants, teams, schools, room utilization, staff coverage.
- Exceptions requiring action.
- Event switcher for events the principal administers.

### 9.2 Events

- Create event: name, slug, description, category, poster, dates, venue, registration window, timezone, status, team-size rules, capacity.
- Edit event; publish/unpublish; transition lifecycle with validation.
- Event creation grants the creator an active principal membership on the new event.
- A principal of any event may create a new event in the MVP; this is an assumption requiring approval (see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

### 9.3 Participants, schools, teams

- Search/filter participants; view registration and team status.
- Manage the event's school list and participation status.
- View all teams, rosters, school, room assignment, and check-in state.
- Assign/reassign teams to rooms with capacity checks.

### 9.4 Rooms and staff

- Create/edit rooms, codes, locations, team capacity, operational status.
- Assign teams; default two teams per room.
- Assign volunteers to rooms (default one active volunteer per room).
- Assign coordinators to rooms or all rooms.
- Assign/revoke event roles by email for existing accounts; every change audited.
- Protect the last active principal from removal.

### 9.5 Schedule

- Create/edit/reorder/publish schedule items.
- Set date, start/end in `Asia/Kolkata`, title, description, location, kind.
- Validate end after start; support point-in-time items and approximate logistics notes.
- Published changes appear to authorized users.

### 9.6 Settings and announcements

- Event details, registration window, team-size limits, capacity, room defaults.
- Announcements with audience (`all`, `participants`, `volunteers`, `coordinators`, `principals`), pinning, publish time.
- Audit log access for the event.
- PWA/branding settings are not event-level settings in the MVP.

---

## 10. Event lifecycle

```
draft → published → registration_open → registration_closed → in_progress → completed → archived
```

- `draft`: visible only to principals; no public registration.
- `published`: visible in the directory; registration not yet open.
- `registration_open`: registration, team creation, and editing allowed within the window.
- `registration_closed`: no new registrations; teams lock; event preparation continues.
- `in_progress`: live operations; check-in allowed.
- `completed`: read-only operational view; no new check-ins.
- `archived`: historical; read-only, hidden from default directory.

Transitions are server-validated. Reverting after registration exists requires an explicit principal action and audit entry. The exact rollback policy is in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

Check-in is allowed while the event is published, in registration, or in progress, but not in draft/completed/archived. This keeps the demo usable while preserving operational closure.

---

## 11. Event schedule seed content

Source: uploaded official schedule `EVENT SCHEDULE XPLORER'26 QR .pdf`, visually verified during planning (3 pages; image-based). Times are `Asia/Kolkata`. Items without an official end time remain point-in-time items; approximate logistics are notes, not invented timestamps.

### 31 October 2026

| # | Time | Item | Kind | Location | Notes |
|---:|---|---|---|---|---|
| 1 | 08:30–08:45 | Reporting time for students | activity | — | — |
| 2 | 09:00–09:30 | Registration and escorting to the room | activity | — | — |
| 3 | 09:30 | Guest arrival | ceremony | — | Point in time |
| 4 | 09:50 | Ceremony starts | ceremony | — | Point in time |
| 5 | 10:30 | Break for 15 minutes | break | — | End not stated; next item is 10:45 |
| 6 | 10:45–11:45 | Workshop | activity | — | — |
| 7 | 11:45 | Coding begins | activity | — | Point in time |
| 8 | 13:15–14:00 | Lunch Break (45 minutes) | break | — | — |
| 9 | 14:00–15:00 | Coding continues | activity | — | — |
| 10 | 15:00–15:20 | Break for 20 minutes | break | — | — |
| 11 | 15:20–18:30 | Coding continues | activity | — | — |
| 12 | 18:30–20:30 | Dinner break, band and flashmob | break | — | — |
| 13 | Note | Rooms with beds and materials for rest | logistics | — | No time stated |
| 14 | Approx. 02:30–03:00 (overnight) | Midnight snacks and tea/coffee provided | logistics | — | Explicitly approximate in source |

### 1 November 2026

| # | Time | Item | Kind | Location | Notes |
|---:|---|---|---|---|---|
| 15 | 07:30–08:00 | Breakfast | break | — | — |
| 16 | 08:00–09:30 | Presentation should be ready | activity | — | — |
| 17 | 09:30–10:00 | Ceremony and Guest addressing | ceremony | — | — |
| 18 | 10:00 | Participants should be at auditorium with their presentation | activity | Auditorium | Only location explicitly supplied |
| 19 | 10:30 | Addressing judges and judging will start | activity | — | Point in time |
| 20 | Throughout judging (2–3 hrs) | Snacks will be provided | logistics | — | Approximate duration, no start time |
| 21 | 12:30 | Closing ceremony | ceremony | — | Point in time |
| 22 | After lunch | Felicitation and award ceremony; closure and dispersal | ceremony | — | No exact time stated |

**Do not add activities, rooms, speakers, or exact times that are not in the source.** If a later official schedule is supplied, version the schedule rather than silently rewriting history.

---

## 12. Teams

- A participant must have a confirmed event registration to create a team.
- The creator becomes leader.
- Team size: min 2, max 5 for Xplorer; configurable per event.
- A team may exist in `forming` state with one member until the registration deadline; it is not eligible for operations/queries that require a complete team.
- One team membership per participant per event.
- Team name unique per event (case-insensitive).
- Invitations:
  - Invite by email; invitee must have a confirmed registration for the event and no team.
  - Invitation is single-use, expiring (default 7 days), revocable, and bound to the invitee.
  - In-app acceptance and email-link acceptance are supported; the email link uses a hashed token.
  - A participant cannot invite themselves or someone already on a team.
- Concurrency: accepting the last open slot must be serialized so the team cannot exceed the maximum.
- Leader capabilities: invite, revoke invitation, remove member, transfer leadership, edit team details before lock. Exact removal/transfer rules are an open question.

---

## 13. Check-in and verification rules

- Check-in is performed by an active volunteer assigned to the room where the participant's team is assigned.
- Verified check-in requires a confirmed registration and a team assigned to that room.
- One verified check-in per participant per event.
- A duplicate attempt returns the existing check-in rather than creating another.
- Unregistered/ambiguous attempts are stored as flagged operational records with the volunteer, room, timestamp, and a note. They do not create accounts or registrations.
- Check-ins are append-only; corrections are new flagged records or a principal-reviewed correction (future). Audit logs capture operational changes.
- Volunteers cannot search participants outside their assigned room.
- Coordinator/principal can view check-in outcomes within their scope, not edit them silently.

---

## 14. Email and notifications

### Authentication email

Supabase Auth sends verification, password reset, and account emails through Resend SMTP. The sender domain must be verified in Resend and configured in Supabase; exact DNS records are retrieved at deployment, never invented.

### Application email

Team invitations and optional registration confirmation can be sent through the Resend API from a server-only module. If email delivery is unavailable, in-app invitations remain functional. Email is an enhancement, not the source of truth.

Future: schedule change notifications, announcements, room assignment notices, reminders.

---

## 15. PWA and responsive requirements

- Web app manifest with Gatik Events identity, icons, theme color, standalone display, start URL.
- Service worker caches only static assets and an offline fallback; no authenticated HTML, participant data, check-in data, or admin responses in public caches.
- Offline banner explains that operational actions require connectivity.
- Offline check-in is **out of scope** for the MVP; safe conflict resolution is not implemented.
- Test widths: 360, 390, 430, 768, 1024, 1280, 1440 CSS px.
- Mobile bottom navigation for participant/volunteer; deliberate drawer/sheet for coordinator/principal.
- No horizontal overflow; touch targets at least 44×44 px where practical; visible focus; reduced-motion support.

---

## 16. Accessibility and quality baseline

- WCAG 2.2 AA target; measured contrast, not eyeballed.
- Semantic landmarks, native controls, labels, error associations, focus management in dialogs, keyboard-operable menus/tabs/tables.
- Status is never communicated by color alone.
- Loading, empty, error, success, disabled, and permission-denied states are designed.
- No fabricated metrics or data; empty states explain the next action.
- All mutations validate server-side; RLS is enabled on every application table.

---

## 17. MVP scope

### Must have

Authentication and verification; event directory; event introduction; role selection from memberships; participant registration/profile; team creation/membership/invitations; problem statement and copy actions; schedule timeline; volunteer room and verification/check-in; coordinator drill-down; principal event/room/schedule/staff administration; database-backed records; RLS; responsive light UI; tested critical flows.

### Should have

Email invitations; announcements; search/filter; audit log UI; PWA install; judge access guide; export/print views.

### Future

QR check-in; realtime dashboards; offline check-in with conflict resolution; certificates; equipment inventory; analytics; multi-campus tenancy; public registration pages; automated reminders; event templates; parent/guardian consent workflows.

---

## 18. Acceptance scenarios

1. **Participant:** sign up → verify → log in → select Xplorer → choose Participant → complete registration → create team → invite registered participant → view challenge → copy AI context → view schedule.
2. **Volunteer:** log in → select Xplorer → Volunteer → open assigned room → search participant → verify registration → record check-in; duplicate and unregistered outcomes behave correctly.
3. **Coordinator:** log in → select Coordinator → see only authorized rooms → room → team → school → participants → confirm check-in status.
4. **Principal:** log in → select Principal → view event health → create/edit schedule item → assign team/volunteer → publish change → see audit entry.
5. **Extensibility:** principal creates another event, configures team rules, adds schedule, publishes; it appears in the directory without a separate application.

Detailed test steps and expected results: [TEST_PLAN.md](TEST_PLAN.md).

---

## 19. Out of scope for MVP

- Payments, ticketing, donations.
- Public anonymous registration.
- Native iOS/Android apps.
- Real-time websocket dashboards.
- Offline check-in.
- Automated certificate generation.
- Full institution ERP, attendance, fees, or academic records.
- Multi-tenant billing.
- AI chat inside the product (the "AI context" is a copyable prompt, not an integrated model).

---

## 20. Evidence and assumptions

**Verified during planning**

- Xplorer schedule PDF exists and contains the October 31 and November 1 items listed above.
- The current workspace has no application code, package manifest, Git repository, Supabase setup, routes, components, tokens, tests, or PWA configuration.
- Node, package managers, Supabase CLI, and Vercel CLI are available; Docker and GitHub CLI are not installed.

**Assumptions requiring approval**

- `gatik-events.shaikaakif.com` as the subdomain.
- Principal-of-any-event can create a new event; creator becomes principal.
- One active volunteer per room by default; configurable by changing assignments.
- Team school and member schools need not match; not yet confirmed.
- Registration remains open for the demo event while its dates make it "live."
- Team invitation email is included if Resend domain verification is complete; in-app invitations are the fallback.

**Missing information**

- Official hackathon name/theme and full brief.
- Full problem-statement content beyond the six section headings.
- Gatik/Xplorer logo and poster asset files and usage rights.
- Institution policy on minors, parental consent, and data retention.
- Final demo credentials and whether a shared staff access code is required.

See [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) before implementation.
