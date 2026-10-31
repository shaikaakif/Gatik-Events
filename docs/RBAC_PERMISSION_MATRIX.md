# Gatik Events — RBAC and Permission Matrix

**Status:** Design only.
**Source of truth for:** role definitions, UI capabilities, server-action permissions, row-level security intent, and authorization invariants.
**Related:** [Database schema](DATABASE_SCHEMA.md) · [Security plan](SECURITY_PLAN.md) · [User flows](USER_FLOWS.md) · [Test plan](TEST_PLAN.md)

---

## 1. Authorization model

Authorization has four layers. A request must pass all applicable layers.

1. **Authentication** — a valid Supabase session (`auth.uid()`), with a confirmed email for application access.
2. **Event scope** — the requested event exists and the user's active membership connects them to it.
3. **Role scope** — the requested operation requires a specific active role; staff visibility may be further limited to a room.
4. **Object scope** — the specific team, room, registration, or invitation belongs to that event and is within the role's scope.

The **role selected in the UI is navigation state, not proof of authorization**. A URL like `/events/xplorer-2026/principal/rooms` is validated against `event_memberships` on the server. Renaming the role segment or editing a cookie cannot elevate access. Database operations never read the URL/role label; they evaluate membership and scope.

### Scopes

| Scope | Meaning |
|---|---|
| **Own** | The authenticated user's profile, registration, team membership, invitations, or verified check-in |
| **Team** | The user's own team and its roster/invitations |
| **Room** | The specific room(s) assigned to the volunteer/coordinator |
| **Event** | All records belonging to one event |
| **Platform** | Event creation across events; limited to an active principal in the MVP |

### Roles

| Role | Authority source | Default Xplorer scope |
|---|---|---|
| Participant | Active `event_memberships.role='participant'` + confirmed registration | Own registration/team; published event content |
| Volunteer | Active volunteer membership + active `volunteer_assignments` | Assigned room only |
| Coordinator | Active coordinator membership + `coordinator_assignments` | Assigned rooms, or all if `room_id` is null |
| Principal | Active principal membership | Entire event; may create events (assumption) |

A user may hold multiple roles. The role switcher lists distinct active roles; entering a role route requires that role. Staff membership does **not** automatically grant participant capabilities (e.g., team creation) unless a confirmed registration and participant membership also exist.

---

## 2. Capability matrix

Legend: **✅** allowed · **◐** scoped · **—** denied · **RPC** operation is only available through a server-side function.

| Capability | Participant | Volunteer | Coordinator | Principal |
|---|---|---|---|---|
| Sign up / log in / reset password / log out | ✅ | ✅ | ✅ | ✅ |
| View event directory | ✅ | ✅ | ✅ | ✅ |
| View published event introduction | ✅ | ✅ | ✅ | ✅ |
| View own role list / switch role | ✅ | ✅ | ✅ | ✅ |
| Register for an open event | ✅ | —* | —* | —* |
| Edit own profile | ✅ | ✅ | ✅ | ✅ |
| View own registration | ✅ | ✅ | ✅ | ✅ |
| View event-wide participant list | — | — | ◐ event scope | ✅ |
| Search participants by name/email/phone/team | — | ◐ assigned room | ◐ assigned rooms | ✅ event |
| Create a team | ✅ | — | — | — |
| Invite an existing registered participant | ◐ team leader | — | — | — |
| Accept/decline own invitation | ✅ | — | — | — |
| View own team roster | ✅ | — | — | — |
| View teams in assigned room | — | ◐ | ◐ | ✅ |
| View schools registered for event | ✅ | ✅ | ✅ | ✅ |
| View school participation counts | — | ◐ room scope | ◐ assigned rooms | ✅ |
| View problem statement | ✅ registered | ✅ | ✅ | ✅ |
| Copy problem statement / AI context | ✅ | ✅ | ✅ | ✅ |
| View published event schedule | ✅ | ✅ | ✅ | ✅ |
| Update own room operational status | — | ◐ assigned room / RPC | — | ✅ any room |
| Record a check-in | — | ◐ assigned room / RPC | — | —** |
| View check-in status in own room | — | ◐ | ◐ | ✅ |
| View own verified check-in | ✅ | — | — | — |
| Flag an unregistered/ambiguous person | — | ◐ assigned room / RPC | — | —** |
| View coordinator dashboard | — | — | ✅ scoped | ✅ |
| Create/edit events | — | — | — | ✅ |
| Publish / change event lifecycle | — | — | — | ✅ |
| Manage event settings (team size, capacity, registration) | — | — | — | ✅ |
| Create/edit rooms | — | — | — | ✅ |
| Assign teams to rooms | — | — | — | ✅ |
| Assign volunteers to rooms | — | — | — | ✅ |
| Assign coordinators / role scope | — | — | — | ✅ |
| Grant/revoke event roles | — | — | — | ✅ |
| Create/edit/publish schedule | — | — | — | ✅ |
| Manage schools for event | — | — | — | ✅ |
| Create announcements | — | — | — | ✅ |
| Read event audit log | — | — | — | ✅ |
| View event-wide operational statistics | — | ◐ own room | ◐ assigned rooms | ✅ |

\* A staff member who also registers as a participant may have participant capabilities. This is a separate membership/registration, not a staff shortcut.
\** Check-ins are volunteer-performed in the MVP to preserve chain of custody. Principals can view and audit; a principal override/correction flow is a future decision.

---

## 3. Route and server-action guards

| Route / action | Guard |
|---|---|
| `/events` | authenticated + email confirmed |
| `/events/[slug]` | authenticated + event visible (published or principal) |
| `/events/[slug]/roles` | authenticated + list only active memberships; `Register` CTA only if eligible |
| `/events/[slug]/participant/*` | active participant membership + (except onboarding) confirmed registration |
| `/events/[slug]/volunteer/*` | active volunteer membership + active room assignment for room-specific pages |
| `/events/[slug]/coordinator/*` | active coordinator membership + coordinator assignment scope |
| `/events/[slug]/principal/*` | active principal membership for that event |
| `register_for_event` | authenticated, event registration open, no existing registration, school in event, capacity available |
| `create_team` | confirmed registration, registration open, no existing team, team cap |
| `invite_team_member` | team leader, registration open, invitee registered/unassigned, capacity |
| `accept_team_invitation` | invitee identity/email, pending/unexpired, capacity under lock |
| `record_check_in` | volunteer assigned to room, participant's team in room, event check-in allowed |
| `assign_event_role` | principal of event, target account exists, not self-elevating beyond role rules |
| `create_event` | active principal of at least one event; creator becomes principal of new event |
| `update_event_status` | principal + valid transition |
| `assign_team_to_room` | principal + room capacity |
| `assign_volunteer` | principal + active volunteer membership |
| `assign_coordinator` | principal + active coordinator membership + room belongs to event |

The server guard is repeated inside the database function where the operation is sensitive. UI hiding is never the only defense.

---

## 4. RLS policy matrix (summary)

Every application table has RLS enabled. The table below states the intended policy; exact SQL belongs in migrations and must be reviewed against this matrix.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | self; scoped staff/teammate via `can_view_event_user` | trigger only | self (limited columns via server action) | no |
| `schools` | schools participating in accessible events; principals all | principal | principal | principal only if unreferenced |
| `events` | published/visible events; principal sees own drafts | `create_event` RPC | principal of event | no (archive) |
| `event_schools` | event participants/staff scoped | principal | principal | principal if unreferenced |
| `event_memberships` | self active/suspended; principal event-wide | principal; `register_for_event` for participant | principal | no (revoke) |
| `event_registrations` | self; principal/coordinator event; volunteer room scope | `register_for_event` RPC | self limited while open; principal cancel | no |
| `teams` | members; principal/coordinator event; volunteer room scope | `create_team` RPC | leader limited; principal status | no (withdraw) |
| `team_members` | teammates; staff scoped | team RPCs only | team RPCs only | team RPCs only |
| `team_invitations` | leader; invitee; principal | team RPC only | invitee/leader RPC only | no (revoke) |
| `rooms` | principal; coordinator scoped; volunteer assigned; participant own team's room | principal | principal; volunteer status via RPC | principal if unreferenced |
| `room_assignments` | principal; coordinator scoped; volunteer assigned; participant own team | principal RPC/table | principal | principal |
| `volunteer_assignments` | principal; coordinator scoped; volunteer self | principal | principal | principal (or inactive) |
| `coordinator_assignments` | principal; coordinator self | principal | principal | principal (or inactive) |
| `check_ins` | participant own verified; volunteer assigned room; coordinator scoped; principal event | `record_check_in` RPC only | no | no |
| `schedule_items` | published event members; principal all | principal | principal | principal if draft |
| `event_challenges` | registered participants/staff; principal all | principal | principal | no |
| `event_announcements` | audience + active role; principal all | principal | principal | principal |
| `audit_logs` | principal of event | definer triggers only | no | no |

### Helper functions used by policies

- `has_event_role(event_id, role)` — active membership check.
- `is_event_principal(event_id)`.
- `is_event_staff(event_id)` — coordinator or principal.
- `is_room_volunteer(event_id, room_id)` — active assignment for the caller.
- `is_room_coordinator(event_id, room_id)` — active coordinator scope, including `room_id is null`.
- `is_team_member(team_id)` / `is_team_leader(team_id)`.
- `can_view_event_user(event_id, target_user_id)` — self, teammate, scoped staff; prevents a global profile directory.
- `can_view_registration(registration_id)` — self, event staff scope, volunteer room scope.

Functions are `STABLE SECURITY DEFINER` where they need to read across RLS, with pinned `search_path` and explicit `auth.uid()` checks. They must not be usable to bypass event scope.

---

## 5. Authorization invariants (must not be broken)

1. **No self-elevation.** A user cannot insert/update their own `event_memberships` role to volunteer, coordinator, or principal. Only a principal may grant staff roles; participant membership comes from registration.
2. **No URL elevation.** The role segment is checked against active memberships. A 403/redirect occurs before data fetch.
3. **No cross-event IDOR.** A team/room/registration/invitation from event B cannot be used in an event A operation. Composite FKs and RPC checks both enforce this.
4. **No cross-room volunteer access.** Volunteer search, roster, status updates, and check-ins require an active assignment to that room.
5. **No coordinator overreach.** A coordinator with room-specific assignments cannot read or mutate other rooms. `room_id = null` is an explicit all-room grant.
6. **No participant directory leak.** A participant cannot query all profiles or another team's roster. Team visibility is membership-based.
7. **No check-in fabrication.** A volunteer cannot check in an unregistered person as verified; negative outcomes are flagged, not converted.
8. **No duplicate verified attendance.** Partial unique index plus RPC transaction.
9. **No team overflow.** Capacity is checked under a row lock; direct membership inserts are revoked.
10. **No last-principal lockout.** Revoking the last active principal fails.
11. **No secret exposure.** Invitation token hashes and service-role credentials are never exposed to the browser. Service role is used only in seed/admin scripts, never in a client import graph.
12. **No trust in client role state.** Cookies/local storage may choose a navigation context, but server and RLS re-evaluate membership on every request.

---

## 6. Role switching behavior

- The role switcher queries distinct active memberships for the event.
- Selecting a role navigates to that role's route. If the membership is missing/revoked, the server redirects to the role selection page with a clear message.
- A user with both participant and coordinator roles sees both; their participant team data is not automatically visible in the coordinator dashboard unless their scope legitimately includes that team (principal/coordinator scope). Avoid accidental self-privilege.
- Switching roles never changes the database membership. It is a context change.
- Staff roles assigned after login appear on refresh/navigation; no realtime requirement in the MVP.

---

## 7. Event creation and institution governance (assumption)

The MVP allows an active principal of **any** event to create a new event; the creator receives an active principal membership on the new event. This is a pragmatic single-institution rule.

Risks:

- In a multi-tenant deployment, one institution's principal could create events in another institution's directory.
- The platform has no institution/organization table yet.

Mitigation for MVP: single-institution deployment, server-side check, audit entry, and a documented open question. Before multi-campus use, introduce `institutions` and `institution_memberships` (principal) and scope event creation to the institution. This is a deliberate roadmap item, not an oversight.

---

## 8. Authorization test cases

These are normative; detailed steps are in [TEST_PLAN.md](TEST_PLAN.md).

| ID | Attempt | Expected |
|---|---|---|
| AUTHZ-01 | Participant changes URL from `/participant` to `/principal` | 403/redirect; no event data in response |
| AUTHZ-02 | Participant calls `assign_event_role` with their own id | Rejected; membership unchanged |
| AUTHZ-03 | Participant queries another team's roster via REST | Empty/denied by RLS |
| AUTHZ-04 | Volunteer queries participants in another room | Denied/empty; search RPC rejects room |
| AUTHZ-05 | Volunteer records check-in for a participant in another room | Rejected |
| AUTHZ-06 | Volunteer marks an unregistered person as verified | Rejected; only flagged attempt allowed |
| AUTHZ-07 | Coordinator assigned rooms 1–3 requests room 4 | Denied |
| AUTHZ-08 | Coordinator with `room_id=null` requests any room | Allowed |
| AUTHZ-09 | Principal of event A edits event B | Denied |
| AUTHZ-10 | Principal revokes the last active principal | Rejected |
| AUTHZ-11 | User accepts an invitation addressed to another email | Rejected |
| AUTHZ-12 | Expired/revoked invitation token | Rejected with safe message |
| AUTHZ-13 | Two users accept the last team slot concurrently | One succeeds; one gets a capacity error |
| AUTHZ-14 | Participant inserts a second team membership directly | Unique constraint/RLS rejects |
| AUTHZ-15 | Client bundle searched for service-role key/token hash | Not present |
| AUTHZ-16 | Cross-event team id used in room assignment | Composite FK/RPC rejects |
| AUTHZ-17 | Suspended membership accesses role route | Denied |
| AUTHZ-18 | Unverified email accesses `/events` | Redirected to verification |

---

## 9. UI permission presentation

- Hide inaccessible navigation and actions, but never rely on hiding.
- When an action is denied by the server, show a specific, safe message and a path back; do not reveal whether a record exists in another event.
- Disable actions with a reason where helpful (e.g., "Registration closes at 6:00 PM IST"), not just a dead button.
- Principal-only destructive actions require confirmation and, for role changes, show the affected person and scope.
- Permission-denied pages are designed, not raw 403 dumps.

---

## 10. Open authorization decisions

- Institution-level principal vs event-level event creation.
- Whether coordinators default to all rooms or must be explicitly assigned.
- Whether principals may override check-ins.
- Whether staff can also be participants in the same event without a second account (schema allows multiple roles; UI policy needs approval).
- Whether team invitations require email delivery or in-app only.
