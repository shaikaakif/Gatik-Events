# Gatik Events — Database Schema

**Status:** Design only. No migrations have been created.
**Source of truth for:** tables, columns, relationships, constraints, indexes, RPC boundaries, triggers, and seed shape.
**Related:** [ERD](DATABASE_ERD.md) · [RBAC and RLS matrix](RBAC_PERMISSION_MATRIX.md) · [Security plan](SECURITY_PLAN.md) · [System architecture](SYSTEM_ARCHITECTURE.md)

---

## 1. Design rules

1. **Event-scoped by default.** Every operational record carries `event_id`. Child tables that could derive it still store it where needed for composite integrity and RLS.
2. **Auth is separate.** `auth.users` is owned by Supabase Auth. Application data lives in `public` and references `auth.users(id)`; no passwords or raw credentials are stored.
3. **Event-scoped roles.** `event_memberships` is the only source of role authority. No `profiles.role` column.
4. **UUID primary keys** for domain entities; `bigint identity` only for append-only audit volume if preferred.
5. **Time.** All instants are `timestamptz` (UTC in storage). Event display timezone is `Asia/Kolkata`. Event windows and schedule days use `date` where the source only supplies a date.
6. **Soft state, not soft deletes by default.** Status fields capture lifecycle. Hard deletes are restricted to safe draft content; operational history is retained.
7. **Server functions for sensitive writes.** Direct table writes are revoked where a multi-row invariant must hold (team size, check-in, role assignment). See §7.
8. **RLS on every application table.** The policies are summarized here and specified in the RBAC matrix.
9. **No fabricated columns.** Every field below has a named use in the MVP or a documented future use.

Required columns are marked `*`; optional are marked `?`.

---

## 2. Enum types

| Enum | Values | Notes |
|---|---|---|
| `event_status` | `draft`, `published`, `registration_open`, `registration_closed`, `in_progress`, `completed`, `archived` | Transitions validated server-side |
| `event_role` | `participant`, `volunteer`, `coordinator`, `principal` | Event-scoped |
| `membership_status` | `active`, `suspended`, `revoked` | `revoked` retained for audit |
| `registration_status` | `pending`, `confirmed`, `waitlisted`, `cancelled` | MVP confirms immediately if capacity allows |
| `team_status` | `forming`, `complete`, `locked`, `withdrawn`, `disqualified` | `forming` may have 1 member |
| `team_member_role` | `leader`, `member` | Exactly one leader per team |
| `invitation_status` | `pending`, `accepted`, `declined`, `revoked`, `expired` | Token single-use |
| `room_status` | `setup`, `active`, `full`, `closed`, `issue` | Volunteer-updatable via RPC |
| `check_in_status` | `verified`, `unregistered`, `ambiguous`, `duplicate`, `flagged` | `verified` is the only positive attendance state |
| `schedule_kind` | `activity`, `break`, `ceremony`, `logistics`, `note` | Keeps timeline semantics |
| `announcement_audience` | `all`, `participants`, `volunteers`, `coordinators`, `principals` | Role-aware read policy |
| `school_event_status` | `invited`, `registered`, `confirmed`, `withdrawn` | Event participation is separate from the school record |

Prefer Postgres enums for values that are truly closed. If a value must be configurable, use a lookup table instead.

---

## 3. Entity catalog

### 3.1 `profiles`

**Purpose:** Application-facing identity for an `auth.users` record. One row per authenticated user.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK, FK `auth.users(id)` on delete cascade |
| `full_name` | `text` | * | 2–120 chars, trimmed |
| `phone` | `text` | ? | Event contact; normalized display, not used as login |
| `avatar_url` | `text` | ? | Optional; initials fallback |
| `created_at` / `updated_at` | `timestamptz` | * | `updated_at` trigger |

- **Constraints/indexes:** `profiles_full_name_trgm_idx` (GIN `pg_trgm`) for operational search; no unique phone.
- **Ownership:** the user owns their profile. Staff may read only profiles permitted by `can_view_event_user(event_id, user_id)`.
- **RLS:** select self; select when `can_view_event_user`; update self (name/phone/avatar only) via server action; insert only by the `handle_new_user` trigger.
- **Creation:** trigger on `auth.users` insert copies `raw_user_meta_data.full_name` and creates the profile. A placeholder name is allowed until onboarding completes.

### 3.2 `schools`

**Purpose:** Canonical institution/school records, reusable across events.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `name` | `text` | * | 2–160 chars |
| `city` | `text` | ? | |
| `state` | `text` | ? | |
| `created_by` | `uuid` | ? | FK `profiles`; null for seed |
| `created_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `lower(name), lower(coalesce(city,''))`; trigram index on name.
- **Ownership:** institutional reference data; principals create/edit. Participants never create arbitrary schools in the MVP.
- **RLS:** authenticated users may select schools participating in an event they can access; principals may insert/update. No deletes when referenced.

### 3.3 `events`

**Purpose:** Event configuration and lifecycle.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `slug` | `text` | * | Unique, URL-safe, immutable after publish unless redirected |
| `title` | `text` | * | 3–160 chars |
| `category` | `text` | * | `hackathon`, `annual_day`, `sports`, `exhibition`, `cultural`, `workshop`, `competition`, `club`, `other` (validated check) |
| `description` | `text` | ? | Short directory copy |
| `poster_url` | `text` | ? | Supabase Storage public URL |
| `venue_name` | `text` | * | |
| `venue_address` | `text` | ? | |
| `timezone` | `text` | * | Default `Asia/Kolkata`; validated IANA name |
| `starts_on` | `date` | * | Event window start |
| `ends_on` | `date` | * | Event window end; `ends_on >= starts_on` |
| `registration_opens_at` | `timestamptz` | ? | |
| `registration_closes_at` | `timestamptz` | ? | Must be after opens |
| `status` | `event_status` | * | Default `draft` |
| `min_team_size` | `smallint` | * | Xplorer 2; `>=1` |
| `max_team_size` | `smallint` | * | Xplorer 5; `>= min` |
| `max_teams` | `integer` | ? | Xplorer seed 12 |
| `capacity` | `integer` | ? | Participant cap; null = no explicit cap |
| `created_by` | `uuid` | * | FK `profiles` |
| `published_at` / `archived_at` | `timestamptz` | ? | |
| `created_at` / `updated_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `slug`; index `(status, starts_on)`; check `min_team_size between 1 and 20`, `max_team_size between min_team_size and 50`, `capacity >= max_team_size` when both set.
- **Ownership:** event principal(s). Created via `create_event` RPC only.
- **RLS:** select if `status <> 'draft'` or requester is an active principal of the event; update by active principal; insert via RPC; no delete (archive instead).

### 3.4 `event_schools`

**Purpose:** Which schools participate in an event, and their participation status.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` on delete cascade |
| `school_id` | `uuid` | * | FK `schools` |
| `status` | `school_event_status` | * | Default `registered` |
| `registered_at` | `timestamptz` | ? | |
| `created_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(event_id, school_id)`; index `(event_id, status)`.
- **Ownership:** principal.
- **RLS:** participant/volunteer/coordinator may select schools for events they can access; principal insert/update/delete when unreferenced.
- **Why not `schools.event_id`:** schools are reusable institutions; event participation is a relationship. This avoids duplicating the same school for every event and makes "registered schools" a real event query.

### 3.5 `event_memberships`

**Purpose:** Event-specific role grants. The sole authorization source for roles.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `user_id` | `uuid` | * | FK `profiles` |
| `role` | `event_role` | * | |
| `status` | `membership_status` | * | Default `active` |
| `granted_by` | `uuid` | ? | FK `profiles`; null for seed/system |
| `granted_at` | `timestamptz` | * | |
| `revoked_at` | `timestamptz` | ? | |
| `notes` | `text` | ? | Admin rationale, no secrets |

- **Constraints/indexes:** unique `(event_id, user_id, role)`; index `(event_id, role, status)`, `(user_id, status)`.
- **Ownership:** principal of the event; participant membership is created by `register_for_event`.
- **RLS:** user selects own active/suspended memberships; principal selects all in their event; principal inserts/updates; no participant/staff self-insert. Role changes audited.
- **Multiple roles:** separate rows. The UI lists distinct active roles. A user can be both participant and coordinator; operations are evaluated against the role required for that operation, not the current UI label.

### 3.6 `event_registrations`

**Purpose:** Participant registration and event-specific student data. Replaces a separate `participants` table.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `user_id` | `uuid` | * | FK `profiles` |
| `school_id` | `uuid` | * | Must be an `event_schools` row |
| `status` | `registration_status` | * | Default `confirmed` on successful registration |
| `grade_year` | `text` | * | Student level; 1–40 chars |
| `roll_number` | `text` | ? | |
| `responses` | `jsonb` | * | Default `{}`; event-specific answers; validated per event schema (future) |
| `registered_at` | `timestamptz` | * | |
| `cancelled_at` | `timestamptz` | ? | |
| `created_at` / `updated_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(event_id, user_id)`; FK `(event_id, school_id)` → `event_schools(event_id, school_id)`; index `(event_id, status)`, `(event_id, school_id)`.
- **Ownership:** participant owns their registration; principal/coordinator read event-wide; volunteer reads only registrations for teams in assigned rooms (via scoped helper/RPC).
- **RLS:** select own; select by principal/coordinator scope; select by volunteer room scope; insert via `register_for_event` RPC; update own limited fields while registration open; principal may cancel.
- **Why no `participants` table:** a participant is an authenticated profile plus an event registration and participant membership. A separate table would duplicate identity and registration status.

### 3.7 `teams`

**Purpose:** Event team identity and lifecycle.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `school_id` | `uuid` | * | School the team represents; must be event-registered |
| `name` | `text` | * | 2–60 chars |
| `code` | `text` | * | Human-readable ops code, e.g. `X26-001`; unique per event |
| `description` | `text` | ? | 500 chars max |
| `leader_user_id` | `uuid` | * | Must be a member; maintained by RPC |
| `status` | `team_status` | * | Default `forming` |
| `created_by` | `uuid` | * | FK `profiles` |
| `created_at` / `updated_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(event_id, lower(name))`; unique `(event_id, code)`; unique `(id, event_id)` for composite child FKs; index `(event_id, status)`, `(event_id, school_id)`.
- **Ownership:** team leader manages identity/invitations; members read; principal can lock/withdraw/disqualify.
- **RLS:** select if member; select by principal/coordinator event scope; select by volunteer whose room contains the team; insert via `create_team`; update leader (name/description/school) while registration open and not locked; principal status updates.
- **Team school vs member schools:** schema does not require every member's school to equal the team school. That is a business decision (open question), not an accidental constraint.

### 3.8 `team_members`

**Purpose:** Membership of a participant in a team, scoped to one event.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `team_id` | `uuid` | * | FK `teams` |
| `user_id` | `uuid` | * | FK `profiles` |
| `event_id` | `uuid` | * | Denormalized for uniqueness/RLS; must match team |
| `role` | `team_member_role` | * | `leader` or `member` |
| `joined_at` | `timestamptz` | * | |

- **PK:** `(team_id, user_id)`.
- **Constraints/indexes:** unique `(event_id, user_id)` — one team per participant per event; FK `(team_id, event_id)` → `teams(id, event_id)`; index `(user_id)`, `(event_id, team_id)`.
- **Ownership:** relationship shared by team; writes only via RPC.
- **RLS:** select teammates; select by staff scope; no direct insert/update/delete for authenticated clients; RPCs only.
- **Why `event_id` here:** without it, a database constraint cannot prevent one user joining teams in multiple events or duplicate membership in the same event. It also makes RLS cheaper. A trigger verifies it matches the team.

### 3.9 `team_invitations`

**Purpose:** Secure, auditable invitations to join a team.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `team_id` | `uuid` | * | FK `teams` |
| `invited_by` | `uuid` | * | Leader who created it |
| `invited_user_id` | `uuid` | * | Exact existing user; lookup by email server-side |
| `invitee_email` | `text` | * | Lowercased at write; for display/audit |
| `token_hash` | `text` | * | SHA-256 of a 32-byte random token; never returned by SELECT |
| `status` | `invitation_status` | * | Default `pending` |
| `expires_at` | `timestamptz` | * | Default now + 7 days |
| `created_at` / `responded_at` | `timestamptz` | * / ? | |

- **Constraints/indexes:** unique `token_hash`; partial unique `(team_id, invited_user_id) where status='pending'`; index `(invited_user_id, status)`, `(event_id, team_id, status)`, `(expires_at) where status='pending'`.
- **Ownership:** team leader creates/revokes; invitee accepts/declines; principal may audit.
- **RLS:** select by leader, invitee, or principal; writes via RPC only; `token_hash` excluded from client-facing views/column grants.
- **Token handling:** generated in a `SECURITY DEFINER` RPC using `gen_random_bytes(32)`; only the hash is stored. The raw token is returned once to the server action that sends the email. In-app acceptance uses the invitation id plus the authenticated invitee identity; the email link additionally verifies the hash.

### 3.10 `rooms`

**Purpose:** Operational rooms for an event.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `name` | `text` | * | e.g. `Room 1` |
| `code` | `text` | * | Unique per event, e.g. `R1` |
| `location` | `text` | ? | Building/floor text |
| `team_capacity` | `smallint` | * | Default 2; >= 1 |
| `status` | `room_status` | * | Default `setup` |
| `status_note` | `text` | ? | 300 chars |
| `status_updated_by` | `uuid` | ? | FK `profiles` |
| `status_updated_at` | `timestamptz` | ? | |
| `sort_order` | `integer` | * | Default 0 |
| `created_at` / `updated_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(event_id, code)`, unique `(id, event_id)`; index `(event_id, sort_order)`.
- **Ownership:** principal configures; assigned volunteer updates status via RPC.
- **RLS:** principal select/insert/update; coordinator select scoped; volunteer select assigned; participant select only the room assigned to their team; direct room updates blocked except RPC.
- **Xplorer seed:** 6 rooms, capacity 2 each.

### 3.11 `room_assignments`

**Purpose:** Which team occupies which room. This is not the same relationship as a volunteer assignment.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `room_id` | `uuid` | * | FK `rooms` |
| `team_id` | `uuid` | * | FK `teams` |
| `assigned_by` | `uuid` | * | FK `profiles` |
| `assigned_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(team_id)` — one room per team; unique `(room_id, team_id)`; FK `(room_id, event_id)` and `(team_id, event_id)`; index `(event_id, room_id)`.
- **Ownership:** principal.
- **RLS:** principal CRUD; coordinator select scoped; volunteer select for assigned room; participant select own team's assignment.
- **Capacity:** `assign_team_to_room` locks the room and checks occupied teams < `team_capacity`.

### 3.12 `volunteer_assignments`

**Purpose:** Volunteer-to-room assignment.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `room_id` | `uuid` | * | FK `rooms` |
| `user_id` | `uuid` | * | Must have active volunteer membership |
| `status` | `membership_status` | * | `active` / `inactive` |
| `assigned_by` | `uuid` | * | FK `profiles` |
| `assigned_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `(room_id, user_id)`; partial unique `(room_id) where status='active'` for the MVP's one-active-volunteer default; index `(user_id, status)`, `(event_id, room_id, status)`.
- **Ownership:** principal; volunteer reads own.
- **RLS:** principal CRUD; coordinator select scoped; volunteer select own; no participant access.
- **Configurability:** if the institution wants multiple active volunteers per room, drop the partial unique index and update the assignment UI; membership/authorization logic already supports multiple volunteers.

### 3.13 `coordinator_assignments`

**Purpose:** Room scope for coordinators. A row with `room_id = null` means all rooms in the event.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `user_id` | `uuid` | * | Must have active coordinator membership |
| `room_id` | `uuid` | ? | Null = all rooms |
| `status` | `membership_status` | * | `active` / `inactive` |
| `assigned_by` | `uuid` | * | FK `profiles` |
| `assigned_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `nulls not distinct (event_id, user_id, room_id)` where status active; index `(event_id, user_id, status)`, `(event_id, room_id)`.
- **Ownership:** principal.
- **RLS:** principal CRUD; coordinator select own; no volunteer/participant access.
- **Why added:** the product says "authorized rooms." A coordinator role alone should not silently grant all rooms.

### 3.14 `check_ins`

**Purpose:** Append-only verification attempts and successful attendance records.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `room_id` | `uuid` | * | FK `rooms` |
| `volunteer_user_id` | `uuid` | * | FK `profiles` |
| `participant_user_id` | `uuid` | ? | Null for unregistered/ambiguous |
| `registration_id` | `uuid` | ? | Null for unregistered/ambiguous |
| `team_id` | `uuid` | ? | Null for unregistered/ambiguous |
| `status` | `check_in_status` | * | |
| `subject_name` | `text` | ? | Volunteer-entered snapshot for flagged attempts |
| `subject_email` | `text` | ? | Minimal, only if supplied |
| `subject_phone` | `text` | ? | Minimal, only if supplied |
| `notes` | `text` | ? | 500 chars |
| `checked_in_at` | `timestamptz` | * | Default now |
| `created_at` | `timestamptz` | * | |

- **Constraints/indexes:** partial unique `(event_id, participant_user_id) where status='verified' and participant_user_id is not null`; check verified requires participant/registration/team; index `(event_id, room_id, checked_in_at desc)`, `(event_id, status)`, `(participant_user_id)`.
- **Ownership:** volunteer records in assigned room; participant reads own verified check-in; coordinator/principal read scoped.
- **RLS:** no direct insert/update/delete for authenticated; RPC only. Select own for participant; volunteer assigned room; coordinator scoped; principal event.
- **Why the name:** it records check-in outcomes, including negative/flagged attempts. A separate `verification_attempts` table would duplicate almost every column; one append-only table is simpler and auditable.

### 3.15 `schedule_items`

**Purpose:** Structured event schedule. Replaces a `schedules` parent table because each event has one schedule.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `day_date` | `date` | * | Display day in event timezone |
| `starts_at` | `timestamptz` | ? | Null for notes/approximate items |
| `ends_at` | `timestamptz` | ? | Null when source gives only a start |
| `time_label` | `text` | ? | Exact or approximate display, e.g. `10:30 AM · 15 min`; `Around 2:30–3:00 AM` |
| `title` | `text` | * | Source title, not embellished |
| `description` | `text` | ? | Source description or operational detail |
| `location` | `text` | ? | Only when supplied |
| `kind` | `schedule_kind` | * | Default `activity` |
| `sequence` | `integer` | * | Timeline order within day |
| `is_published` | `boolean` | * | Default true for seeded content |
| `created_by` / `created_at` / `updated_at` | `uuid` / `timestamptz` | * | |

- **Constraints/indexes:** unique `(event_id, day_date, sequence)`; check `ends_at is null or starts_at is null or ends_at > starts_at`; check `starts_at is not null or time_label is not null`; index `(event_id, day_date, sequence)`.
- **Ownership:** principal writes; all authorized event users read published items.
- **RLS:** select if `is_published` and event is visible; principal CRUD; no participant writes.
- **Timezone:** `starts_at`/`ends_at` are stored with offset; `day_date` is assigned in `Asia/Kolkata`. The UI formats in the event timezone.

### 3.16 `event_challenges`

**Purpose:** Structured problem statement and AI context source.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | Unique FK `events` |
| `title` | `text` | * | Challenge title |
| `summary` | `text` | ? | Short intro |
| `sections` | `jsonb` | * | Ordered array `[{id, heading, body}]`; required headings validated by app |
| `is_published` | `boolean` | * | Default false until content approved |
| `version` | `integer` | * | Default 1 |
| `updated_by` | `uuid` | ? | FK `profiles` |
| `created_at` / `updated_at` | `timestamptz` | * | |

- **Constraints/indexes:** unique `event_id`; check `jsonb_typeof(sections) = 'array'`.
- **Ownership:** principal; participants read published challenge for their event.
- **RLS:** select if published and user can access event; principal CRUD.
- **AI context:** generated at read time from stored `title`, `summary`, `sections`, team-size rules, and evaluation criteria. No separate stale `ai_context` column.

### 3.17 `event_announcements`

**Purpose:** Published operational announcements.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `uuid` | * | PK |
| `event_id` | `uuid` | * | FK `events` |
| `title` | `text` | * | 3–140 chars |
| `body` | `text` | * | Plain text; no raw HTML |
| `audience` | `announcement_audience` | * | Default `all` |
| `is_pinned` | `boolean` | * | Default false |
| `published_at` | `timestamptz` | * | |
| `created_by` | `uuid` | * | FK `profiles` |
| `created_at` | `timestamptz` | * | |

- **Constraints/indexes:** index `(event_id, published_at desc)`, `(event_id, audience, is_pinned)`.
- **Ownership:** principal.
- **RLS:** select by audience and active role; principal CRUD.

### 3.18 `audit_logs`

**Purpose:** Immutable record of security- and operations-sensitive changes.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | `bigint generated always as identity` | * | PK |
| `event_id` | `uuid` | ? | Null for account/global actions |
| `actor_user_id` | `uuid` | ? | Null for seed/system |
| `action` | `text` | * | e.g. `event_role.granted`, `team.room_assigned` |
| `entity_type` | `text` | * | |
| `entity_id` | `uuid` | ? | |
| `metadata` | `jsonb` | * | Before/after summaries; no raw tokens or unnecessary PII |
| `created_at` | `timestamptz` | * | Default now |

- **Constraints/indexes:** index `(event_id, created_at desc)`, `(actor_user_id, created_at desc)`.
- **Ownership:** system-written; principal reads their event.
- **RLS:** select principal of event; no insert/update/delete for authenticated clients. Writes happen in `SECURITY DEFINER` RPCs/triggers.

---

## 4. Deliberately omitted or merged entities

| Proposed entity | Decision | Reason |
|---|---|---|
| `user_preferences` | **Omit for MVP** | No preference is required to complete a flow. Add when notification/theme preferences exist. Avoid an empty table. |
| `participants` | **Merge into** `event_registrations` + `event_memberships` + `profiles` | A participant is an authenticated identity with an event registration and a participant role. A separate table duplicates identity, status, and school. |
| `schedules` | **Merge into** `schedule_items` | One schedule per event; a parent table adds a join with no current benefit. Add versioning later if multiple public schedule versions are needed. |
| `event_settings` | **Use typed columns in** `events` | Team sizes, capacity, registration window, timezone, and status are typed and queryable. A key-value settings table invites unvalidated data. Add a typed settings table only for genuinely optional modules. |
| `room_assignments` vs `volunteer_assignments` | **Keep both** | They represent different relationships: team→room vs volunteer→room. Merging them would create a polymorphic foreign key and weaker constraints. |
| `registrations` | **Rename** `event_registrations` | Makes event scope explicit and avoids implying a global registration. |
| `check_ins` | **Keep, broaden semantics** | It records positive and flagged outcomes; a separate attempts table would duplicate data. |

### Added entities not in the original proposal

- `event_schools` — event-scoped school participation.
- `coordinator_assignments` — least-privilege room scope.
- `event_challenges` — structured problem statement and AI context source.

These are justified by explicit product requirements, not speculative features.

---

## 5. Relationship rules

1. `auth.users 1—1 profiles`.
2. `events 1—N event_memberships`; `profiles 1—N event_memberships`. Unique per `(event, user, role)`.
3. `events 1—N event_schools N—1 schools`.
4. `event_registrations` references `event_schools`, so a participant cannot register under a school that is not participating in the event.
5. `teams` references `event_schools`; a team belongs to one event and represents one participating school.
6. `team_members` references `teams` via `(team_id, event_id)` and enforces one team per participant per event.
7. `teams.leader_user_id` must be a member with role `leader`. Exactly one leader; transfer is transactional.
8. `room_assignments` one room per team; capacity enforced by RPC.
9. `volunteer_assignments` one active volunteer per room by default.
10. `coordinator_assignments.room_id = null` means all rooms; otherwise only that room.
11. `check_ins` references a room and volunteer; verified rows additionally reference participant, registration, and team, all in the same event.
12. `schedule_items` belong directly to an event; one event can have many days.
13. `audit_logs` may reference an event; global account events may have no event.

### Cross-event integrity

Composite foreign keys and helper checks ensure child records cannot point at a team/room/registration from another event:

- `(team_id, event_id)` → `teams(id, event_id)`
- `(room_id, event_id)` → `rooms(id, event_id)`
- `(event_id, school_id)` → `event_schools(event_id, school_id)`

This is a deliberate denormalization of `event_id` onto child tables. It costs a few bytes and prevents a class of IDOR/data-integrity bugs that RLS alone would not catch.

---

## 6. Index plan

| Table | Index | Purpose |
|---|---|---|
| `profiles` | GIN trigram on `full_name` | Scoped name search |
| `events` | `(status, starts_on)`; unique `slug` | Directory, deep links |
| `event_memberships` | `(event_id, role, status)`, `(user_id, status)` | Role checks, role switcher |
| `event_registrations` | `(event_id, status)`, `(event_id, school_id)`, unique `(event_id, user_id)` | Counts, school views, duplicate prevention |
| `teams` | `(event_id, status)`, `(event_id, school_id)`, unique `(event_id, lower(name))` | Lists, filters, naming |
| `team_members` | `(event_id, user_id)` unique, `(team_id)` | Membership lookup, roster |
| `team_invitations` | partial `(team_id, invited_user_id) where pending`, `(invited_user_id, status)` | Inbox, duplicate prevention |
| `rooms` | `(event_id, sort_order)`, unique `(event_id, code)` | Room board |
| `room_assignments` | unique `(team_id)`, `(event_id, room_id)` | Occupancy, team lookup |
| `volunteer_assignments` | partial unique `(room_id) where active`, `(user_id, status)` | One volunteer/room, my room |
| `coordinator_assignments` | `(event_id, user_id, status)`, `(event_id, room_id)` | Scope checks |
| `check_ins` | partial unique `(event_id, participant_user_id) where verified`, `(event_id, room_id, checked_in_at desc)` | Duplicate prevention, room activity |
| `schedule_items` | `(event_id, day_date, sequence)` unique | Timeline |
| `event_announcements` | `(event_id, published_at desc)` | Overview feed |
| `audit_logs` | `(event_id, created_at desc)` | Audit review |

Enable `pg_trgm` for name/team search. Supabase's `pgcrypto` is used for invitation token hashing and random team codes.

---

## 7. Database functions, RPCs, and triggers

All functions use `SECURITY DEFINER` only when they must cross RLS to enforce an invariant. Every definer function sets `search_path = public, auth` (or a pinned safe path) and validates `auth.uid()` itself. Direct writes are revoked for sensitive tables.

### Authentication/profile

| Object | Responsibility |
|---|---|
| `handle_new_user()` trigger on `auth.users` | Create `profiles` row from auth metadata |
| `set_updated_at()` trigger | Maintain `updated_at` |
| `current_event_roles(event_id)` | Return active roles for the caller; used by UI/guards |

### Event and role management

| RPC | Responsibility |
|---|---|
| `create_event(payload jsonb)` | Principal-of-any-event check; insert event in `draft`; insert creator principal membership; audit |
| `update_event_status(event_id, next_status)` | Validate transition; update timestamps; audit |
| `assign_event_role(event_id, email, role)` | Principal only; resolve existing account; insert active membership; audit |
| `revoke_event_role(event_id, user_id, role)` | Principal only; prevent last active principal; set `revoked`; audit |
| `assign_coordinator(event_id, user_id, room_id)` | Principal; validate coordinator membership; upsert scope |
| `assign_volunteer(event_id, room_id, user_id)` | Principal; validate volunteer membership; deactivate old active assignment in same transaction |

### Participation and teams

| RPC | Responsibility |
|---|---|
| `register_for_event(event_id, school_id, grade_year, roll_number, responses)` | Registration window/capacity check; insert/confirm registration; ensure participant membership; audit |
| `create_team(event_id, name, school_id, description)` | Confirmed registration; no existing team; team cap; insert team + leader member; generate code |
| `invite_team_member(team_id, email)` | Leader only; invitee registered and unteamed; team capacity; create token/hash; return invitation id and raw token once |
| `accept_team_invitation(invitation_id, token)` | Invitee identity/email match; expiry; capacity re-check under lock; insert member; update invitation; audit |
| `decline_team_invitation(invitation_id)` | Invitee only; status update |
| `revoke_team_invitation(invitation_id)` | Leader only; status update |
| `remove_team_member(team_id, user_id)` | Leader only; not self; team not locked |
| `leave_team(team_id)` | Member; leader must transfer first or disband a one-person forming team |
| `transfer_team_leadership(team_id, new_leader_user_id)` | Leader only; transactional role swap |
| `update_team_details(team_id, name, description, school_id)` | Leader; registration open; not locked |
| `lock_team(team_id)` / principal bulk lock | Principal or lifecycle transition |

### Operations

| RPC | Responsibility |
|---|---|
| `assign_team_to_room(event_id, team_id, room_id)` | Principal; lock room; capacity check; upsert assignment; audit |
| `update_room_status(room_id, status, note)` | Assigned volunteer or principal; validate enum; audit |
| `search_room_participants(room_id, query)` | Assigned volunteer/coordinator/principal; room-scoped results; limit 10; returns minimal fields |
| `get_room_roster(room_id)` | Room-scoped teams/members/check-in states |
| `record_check_in(event_id, room_id, participant_user_id, status, subject jsonb, notes)` | Assigned volunteer; registration/team/room checks; duplicate handling; insert attempt; audit |
| `get_event_operational_stats(event_id)` | Principal/coordinator; real aggregates scoped by assignment |

### Scheduling and content

| RPC/trigger | Responsibility |
|---|---|
| `create_schedule_item` / `update_schedule_item` / `reorder_schedule_items` | Principal; timezone/validation; audit on publish |
| `publish_schedule_item` | Principal; visibility toggle |
| `update_event_challenge` | Principal; validate section shape; bump version; audit |
| `create_announcement` / `update_announcement` | Principal; audience validation |

### Audit triggers

- `event_memberships` insert/update → `event_role.granted` / `event_role.revoked`.
- `events.status` change → `event.status_changed`.
- `room_assignments`, `volunteer_assignments`, `coordinator_assignments` changes → assignment audit.
- `check_ins` insert → `check_in.recorded` (metadata only; no raw contact data beyond IDs).
- `schedule_items` publish/unpublish → `schedule.published`.
- `audit_logs` has no update/delete policy; triggers run as definer.

### Invariants enforced in the database

- One active principal minimum per event.
- One registration per user/event.
- One team per user/event.
- One leader per team; leader is a member.
- Team size ≤ event `max_team_size`; minimum checked at operational eligibility, not by preventing a one-person `forming` team.
- Room team count ≤ `rooms.team_capacity`.
- One active volunteer per room (MVP partial unique index).
- One verified check-in per participant/event.
- Verified check-in references a room where the participant's team is assigned.
- No check-in in draft/completed/archived events.
- Invitation token hash unique and single-use.
- Schedule end after start when both exist.
- Cross-event references rejected by composite FKs.

---

## 8. Ownership and privacy summary

| Data | Owner | Who can read |
|---|---|---|
| Profile name/phone | User | Self; teammates; staff scoped to event/room; principal event-wide |
| Email | Supabase Auth + server lookup | Self; principal/coordinator/volunteer only via scoped RPC returning minimal fields |
| Registration responses | Participant | Self; principal/coordinator event scope; volunteer room scope |
| Team roster | Team | Team; staff scoped; principal |
| Invitations | Leader/invitee | Leader; invitee; principal audit |
| Check-ins | Volunteer/event | Participant own verified; volunteer own room; coordinator scoped; principal event |
| Audit logs | Event | Principal of event |

**Never store** raw passwords, invitation tokens (only hashes), full JWTs, service-role keys, or unnecessary identity documents. Do not put PII in URLs except an invitation token, which is single-use, expiring, and `Referrer-Policy: no-referrer`.

---

## 9. Seed shape (Xplorer 2026)

This seed is inserted by a local/CI script using the Supabase service role. It is never exposed to the browser.

- 1 event: `xplorer-2026`, title `Gatik Xplorer 2026 — Chapter 4`, category `hackathon`, venue `Gatik Junior College, The Bodhi Tree Campus, Bhanur`, dates 2026-10-31 to 2026-11-01, timezone `Asia/Kolkata`, status `registration_open` for the demo, min/max team 2/5, max teams 12.
- 1 challenge row with the six required section headings; `is_published=false` until the real content is supplied. **Content is a blocker, not a placeholder to invent.**
- 22 schedule items exactly as in [PRODUCT_SPEC.md §11](PRODUCT_SPEC.md#11-event-schedule-seed-content).
- 6 rooms (`Room 1`–`Room 6`), each `team_capacity=2`.
- 12 synthetic teams, 2 assigned per room; 24–36 synthetic participant profiles/registrations; no real personal information.
- 1 principal demo account, 2 coordinator demo accounts (one all rooms, one rooms 1–3), 6 volunteer demo accounts (one per room), 3 participant demo accounts.
- All demo auth users have email confirmed at creation (admin seed) so judges do not depend on inbox delivery. Real signups use normal verification.
- Audit log entries for seeded role/room assignments may be marked `actor_user_id = null` and `metadata.seed = true`.

**Demo capacity note:** 12 seeded teams fill the default event cap. The demo plan either leaves one open slot or uses a dedicated late-entry flow; this is a demo-data decision, not a schema change. See [DEMO_PLAN.md](DEMO_PLAN.md).

---

## 10. Migration and versioning strategy

1. Create Supabase migrations in order: extensions → enums → core identity/events → membership/schools → registrations/teams/invitations → rooms/assignments → check-ins → schedule/challenge/announcements → audit/triggers/RPCs → seed.
2. Apply to a development project first; review generated SQL; never edit a migration already applied to production.
3. Use forward-only migrations with a rollback note. Destructive changes require a backup and explicit approval.
4. Enable RLS in the same migration that creates each table; do not ship a table with RLS disabled.
5. Seed uses idempotent upserts keyed by stable IDs/slugs, not blind inserts.
6. Generate TypeScript database types from the schema (`supabase gen types typescript`) after migrations; commit generated types.
7. Add pgTAP or SQL assertion tests for RLS and invariants before production.

**Current environment note:** Supabase CLI 2.54.11 is installed, but Docker is not available. Local `supabase start` may not run until Docker is installed (requires approval). A hosted development project can be used in the interim; this is documented in the roadmap and test plan.

---

## 11. Open schema decisions

- Team school vs member school rule.
- Check-in frequency (one per event vs per day/room).
- Whether coordinators can ever see all rooms by default without an explicit assignment.
- Whether a principal-of-any-event may create events or an institution-level role is required.
- Whether participants may add a missing school or must request principal creation.
- Waitlist behavior when capacity is reached.
- Retention period and minor/guardian consent requirements.

These are tracked in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), not silently resolved in code.
