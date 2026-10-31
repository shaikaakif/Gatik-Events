# Gatik Events — Test Plan

**Status:** Planning only. No test has been written or run. No result is claimed.
**Source of truth for:** test strategy, environments, case IDs, expected behavior, evidence, and release exit criteria.
**Related:** [Product spec](PRODUCT_SPEC.md) · [RBAC matrix](RBAC_PERMISSION_MATRIX.md) · [Security plan](SECURITY_PLAN.md) · [Demo plan](DEMO_PLAN.md)

---

## 1. Quality strategy

Test the **authorization boundaries and end-to-end workflows** first, then polish. A beautiful screen that leaks another room's participants is a failure; a plain screen that correctly checks in a participant is a working product.

Layers:

1. **Unit** — validators, lifecycle transitions, AI-context generation, time formatting, team-size rules.
2. **Database/RLS** — real JWTs against a Supabase project; table and RPC permissions; invariants.
3. **Integration** — server actions with mocked/real Supabase; typed action states.
4. **E2E** — Playwright across participant, volunteer, coordinator, principal journeys.
5. **Accessibility** — axe + keyboard/focus/manual checks.
6. **Responsive/visual** — screenshots at required widths; overflow/contrast checks.
7. **PWA/performance** — manifest, service worker behavior, Lighthouse.
8. **Security** — bundle/secret scan, headers, IDOR/elevation attempts.

---

## 2. Environments and tooling

| Environment | Purpose | Data |
|---|---|---|
| Local dev | Fast UI/unit work | Synthetic seed |
| Supabase dev project | RLS/RPC/integration tests | Synthetic seed; resettable |
| Vercel preview | Deploy/auth/PWA checks | Dev Supabase |
| Production | Judge demo | Synthetic demo data only |

**Current constraints (verified during planning)**

- Node `24.18.1`, pnpm `10.18.1`, Supabase CLI `2.54.11`, Vercel CLI `48.2.9` are installed.
- **Docker is not installed.** `supabase start` (local Postgres) may not work until Docker is installed with approval; use a hosted development project or install Docker.
- Playwright/Vitest are not installed yet; add at M0/M11 after approval.
- No `.env`, Supabase project, or database exists yet.

**Commands (to be created in M0; names are targets, not current facts)**

```
pnpm lint
pnpm typecheck
pnpm test          # Vitest unit/integration
pnpm test:e2e      # Playwright
pnpm test:rls      # SQL/pgTAP or scripted JWT assertions
pnpm build
```

Do not report a command as passing until it exists and has been run.

---

## 3. Test data

- Synthetic only: names like “Aarav Demo”, emails `demo.participant1@example.com`, schools “Northstar Demo School” / “Riverdale Demo College”.
- No real student names, phone numbers, photos, or institutional records.
- Seed: 1 event, 6 rooms, 12 teams, 24+ participants, 6 volunteers, 2 coordinators, 1 principal, 3 participant demo accounts.
- Deterministic IDs/slugs for reset; one command restores known state.
- Include edge fixtures: one-person forming team, full team (5), unassigned team, room with only one team, coordinator scoped to rooms 1–3, volunteer with no room (permission test), participant with no team, invitation pending/expired/revoked, duplicate check-in attempt.
- Never use production participant data for tests or screenshots.

---

## 4. Traceability to judging criteria

| Criterion | Evidence from testing |
|---|---|
| Problem understanding (10%) | End-to-end scenarios, honest problem framing, role-specific workflows |
| UX/UI (20%) | Responsive screenshots, a11y checks, interaction states, visual QA |
| Data/domain modeling (10%) | RLS/invariant tests, ERD consistency, cross-event isolation |
| Solution approach/execution (30%) | Working vertical slices, architecture, test results, no mocks |
| Working demo (20%) | E2E pass on deployed URL, seeded reset, judge accounts |
| Innovation/extensibility (10%) | New-event flow, event-scoped roles, roadmap evidence |

---

## 5. Authentication tests

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| AUTH-01 | Signup | Submit name/email/strong password | Account created; verification screen; profile row created |
| AUTH-02 | Duplicate signup | Use existing email | Safe generic message; no account enumeration |
| AUTH-03 | Unverified access | Log in before verifying | Verification screen; no event data |
| AUTH-04 | Verify email | Open valid link/callback | Session established; directory accessible |
| AUTH-05 | Expired/invalid verify link | Open stale link | Safe error + resend option |
| AUTH-06 | Login | Valid credentials | Session; directory |
| AUTH-07 | Wrong password | Invalid password | Field error; no account-existence leak |
| AUTH-08 | Open redirect | `next=https://evil.example` | Rejected; stay on app origin |
| AUTH-09 | Reset password | Request → email → new password | Reset works; old password fails |
| AUTH-10 | Logout | Click sign out | Session/cookies cleared; protected route redirects |

---

## 6. Event and role tests

| ID | Scenario | Expected |
|---|---|---|
| EVENT-01 | Directory loads seeded event | Xplorer card with correct title/dates/venue/timezone |
| EVENT-02 | Draft visibility | Non-principal cannot see/read draft; principal can |
| EVENT-03 | Event search/filter | Real results; empty state honest |
| EVENT-04 | Event introduction | Correct data from DB; no hardcoded content |
| EVENT-05 | Second event | Published event appears without code changes |
| ROLE-01 | No membership | No role cards; registration CTA or staff explanation |
| ROLE-02 | Single role | Enters correct dashboard |
| ROLE-03 | Multi-role | Switcher lists both; switching works |
| ROLE-04 | URL tamper | `/principal` as participant → 403/redirect; no data |
| ROLE-05 | Revoked role | Removed on next request; safe explanation |
| ROLE-06 | Suspended membership | Denied access; no data |

---

## 7. Registration and team tests

| ID | Scenario | Expected |
|---|---|---|
| REG-01 | Complete registration | Confirmed registration + participant membership; dashboard |
| REG-02 | Duplicate registration | Rejected; link to existing registration |
| REG-03 | Registration closed | Blocked with clear deadline |
| REG-04 | Capacity full | Blocked/waitlist per policy; no overfill |
| REG-05 | Invalid school | Rejected; school must be event-registered |
| REG-06 | Required fields/errors | Inline + summary; values preserved |
| TEAM-01 | Create team | Team + leader membership; code generated |
| TEAM-02 | Duplicate team name | Case-insensitive rejection |
| TEAM-03 | Second team same event | Rejected by unique constraint/RPC |
| TEAM-04 | Team size > max | Sixth member rejected |
| TEAM-05 | One-person forming team | Allowed; flagged incomplete for operations |
| TEAM-06 | Non-leader edits team | Denied |
| TEAM-07 | Leader transfers leadership | Exactly one leader; roles swap transactionally |
| TEAM-08 | Leader removes member | Removed; roster updates; audit |
| TEAM-09 | Leave/leader leave | Policy enforced; no orphan leader |
| TEAM-10 | Locked team edit | Denied after registration close/lock |

---

## 8. Invitation tests

| ID | Scenario | Expected |
|---|---|---|
| INV-01 | Invite registered unteamed user | Pending invitation; in-app + email if configured |
| INV-02 | Invite unregistered email | Blocked with clear message; no account created |
| INV-03 | Invite user already on team | Blocked |
| INV-04 | Duplicate pending invite | No duplicate; existing pending state |
| INV-05 | Accept valid invitation | Member added; invitation accepted; team capacity respected |
| INV-06 | Accept as wrong user/email | Denied |
| INV-07 | Expired/revoked token | Denied with safe message; leader can resend |
| INV-08 | Concurrent last-slot accepts | One succeeds; one gets capacity error |
| INV-09 | Token not exposed | Hash only in DB; raw token absent from client bundle/logs |

---

## 9. Challenge and schedule tests

| ID | Scenario | Expected |
|---|---|---|
| CHAL-01 | Published challenge render | All stored sections in order; readable layout |
| CHAL-02 | Copy statement | Complete formatted text; success feedback |
| CHAL-03 | Copy AI context | Includes event/challenge/outcome/evaluation/team-size context; generated from DB |
| CHAL-04 | Clipboard denied | Selectable fallback + explanation |
| CHAL-05 | Unpublished challenge | Honest unavailable state; no invented content |
| CHAL-06 | XSS payload in content | Rendered as text; no script execution |
| SCH-01 | Day tabs | Oct 31 / Nov 1 correct items |
| SCH-02 | Exact times | Source times preserved; no invented end times |
| SCH-03 | Notes | Overnight snacks/logistics display as notes, not exact events |
| SCH-04 | Timezone | Renders IST; correct boundary at midnight |
| SCH-05 | Now/next | Correct relative to current instant; static fallback outside event |
| SCH-06 | Location | Only auditorium appears where supplied |
| SCH-07 | Empty schedule | Honest empty state |
| SCH-08 | Unpublished item | Hidden from participants; visible to principal |

---

## 10. Volunteer and check-in tests

| ID | Scenario | Expected |
|---|---|---|
| VOL-01 | Volunteer scope | Only assigned room/teams |
| VOL-02 | Search by name/email/phone/team | Room-scoped matches only; limit 10 |
| VOL-03 | Search outside room | No result/denied; explanation of scope |
| VOL-04 | Room status update | Allowed statuses; note; audited; no rename/capacity change |
| VOL-05 | Unassigned volunteer | No room data; clear empty state |
| CHECK-01 | Verified check-in | Record with participant/registration/team/room/volunteer/timestamp |
| CHECK-02 | Duplicate check-in | Existing record shown; no second verified row |
| CHECK-03 | Unregistered person | Flagged attempt; no account/registration created |
| CHECK-04 | Ambiguous person | Flagged with note; coordinator sees exception |
| CHECK-05 | Check-in other room | RPC/RLS rejects |
| CHECK-06 | Check-in in closed/completed event | Rejected |
| CHECK-07 | Participant own check-in view | Only own verified record |
| CHECK-08 | Coordinator visibility | Check-in appears in scoped room/team view |

---

## 11. Coordinator tests

| ID | Scenario | Expected |
|---|---|---|
| COORD-01 | Scoped coordinator | Rooms 1–3 only |
| COORD-02 | All-room coordinator | All rooms |
| COORD-03 | Guess room 4 URL as scoped | Denied; no data |
| COORD-04 | Counts | Registrations/teams/participants/check-ins match SQL fixtures |
| COORD-05 | Drill-down | Room → team → school → participants; breadcrumb/back works |
| COORD-06 | Exceptions | Unassigned team/room, incomplete team, flagged check-in listed |
| COORD-07 | Volunteer activity | Visible only for authorized rooms |
| COORD-08 | Read-only boundary | No role/check-in editing |

---

## 12. Principal tests

| ID | Scenario | Expected |
|---|---|---|
| PRIN-01 | Create draft event | Draft created; creator principal membership |
| PRIN-02 | Publish event | Appears in directory; required fields enforced |
| PRIN-03 | Invalid lifecycle transition | Rejected with reason |
| PRIN-04 | Edit event/settings | Persisted; validation; audit |
| PRIN-05 | Create/edit room | Capacity/code constraints; audit |
| PRIN-06 | Assign team to room | Capacity enforced; one room/team |
| PRIN-07 | Assign volunteer | Must have volunteer membership; one active/room default |
| PRIN-08 | Assign coordinator | Must have coordinator membership; room scope |
| PRIN-09 | Grant/revoke role | Principal only; audited; target exists |
| PRIN-10 | Last principal protection | Revoke/demote last principal rejected |
| PRIN-11 | Schedule CRUD/reorder/publish | Persisted; visible after publish; validation |
| PRIN-12 | School management | Add/edit; participation counts |
| PRIN-13 | Announcement | Audience filtering; principal publish |
| PRIN-14 | Audit log | Sensitive changes present; immutable |
| PRIN-15 | Non-principal admin action | Denied at server + RLS |

---

## 13. Security/RLS tests

| ID | Attempt | Expected |
|---|---|---|
| SEC-01 | Search client bundle for service key | Not found |
| SEC-02 | Search repo for secrets | None committed |
| SEC-03 | `NEXT_PUBLIC_` audit | No private values |
| SEC-04 | CSRF/cross-origin server action | Rejected/Origin checked |
| SEC-05 | XSS in name/team/announcement | Escaped; no execution |
| SEC-06 | SQL injection payload | Parameterized; no error/data leak |
| SEC-07 | Auth/search abuse | Supabase limits; result caps; no enumeration |
| SEC-08 | Malicious upload (SVG/HTML/oversize) | Rejected |
| SEC-09 | Invitation token in logs/referrer | Redacted/no-referrer |
| SEC-10 | PWA cache inspect | No auth/participant/check-in data |
| SEC-11 | Security headers | CSP/HSTS/nosniff/frame-ancestors present in prod |
| SEC-12 | Cross-event ID substitution | Rejected by composite FK/RPC/RLS |
| AUTHZ-01…18 | See [RBAC matrix §8](RBAC_PERMISSION_MATRIX.md#8-authorization-test-cases) | All pass |

RLS tests must use real JWTs and the anon key, not the service role. Test both allowed and denied paths; a policy that allows everything can still pass a positive test.

---

## 14. Accessibility tests

| ID | Check | Pass condition |
|---|---|---|
| A11Y-01 | Automated axe scan | No critical/serious violations on primary pages |
| A11Y-02 | Keyboard traversal | All controls reachable; logical order; no trap |
| A11Y-03 | Focus visibility | Visible ring on every interactive element |
| A11Y-04 | Dialog focus | Enters dialog, trapped, Escape closes, returns to trigger |
| A11Y-05 | Form labels/errors | Accessible names; errors associated; summary links |
| A11Y-06 | Contrast | Text ≥4.5:1, large text ≥3:1, controls ≥3:1 |
| A11Y-07 | Target size | ≥24px min; ≥44px preferred; mobile primary 48px |
| A11Y-08 | Status announcements | Copy/check-in outcomes announced via live region |
| A11Y-09 | Reduced motion | No transforms/staggers; content still updates |
| A11Y-10 | Zoom/reflow | 200% and 360px; no clipped actions/overflow |
| A11Y-11 | Tables | Captions/headers; sort state; mobile alternative |
| A11Y-12 | Images/icons | Meaningful alt; decorative hidden; icon-only names |

Automated tools catch only a subset; manual checks and, where possible, a screen-reader spot check are required. Do not claim “fully accessible.”

---

## 15. Responsive and visual tests

Viewports: **360, 390, 430, 768, 1024, 1280, 1440**.

- No horizontal overflow on primary pages.
- Bottom nav doesn’t cover content/focus; safe areas respected.
- Forms fit; dialogs/sheets fit with keyboard open.
- Tables have a deliberate mobile treatment.
- Long names/emails/team names wrap or truncate with accessible full text.
- Sticky challenge copy bar and schedule tabs don’t obscure focus.
- Event hero/typography doesn’t clip at 360/1440.
- Visual hierarchy: one clear primary action per screen; no generic card grid repetition.
- Token consistency: colors, radii, spacing, shadows, type roles.

Capture before/after screenshots for defects. Store ephemeral artifacts outside Git unless the repository has an approved evidence folder.

---

## 16. PWA tests

| ID | Check | Pass condition |
|---|---|---|
| PWA-01 | Manifest | Name, icons, start URL, standalone, theme/background |
| PWA-02 | Install | Installs on supported mobile/desktop |
| PWA-03 | Standalone launch | Opens without browser chrome; auth works |
| PWA-04 | Offline navigation | Shows offline page, not cached private page |
| PWA-05 | Cache inspection | No auth/participant/check-in/admin responses |
| PWA-06 | Update flow | New service worker activates; no stale data |
| PWA-07 | Sign-out cache clear | Shared-device privacy preserved |
| PWA-08 | iOS meta/safe area | Correct icon/status bar; content not hidden |

---

## 17. Performance checks

Measure, don’t assert:

- Lighthouse on the deployed primary pages (mobile + desktop).
- LCP, CLS, INP/TBT, initial JS, image sizes.
- No long tasks >200ms in primary flows where measurable.
- Server queries are indexed; room roster avoids N+1.
- Target: LCP <2.5s on a typical 4G profile, CLS <0.1. If missed, record actual values and the highest-impact fix.

---

## 18. E2E acceptance suite

| ID | Flow | Pass condition |
|---|---|---|
| E2E-01 | New participant → verify → event → register → create team → invite | Real DB records; team visible after refresh |
| E2E-02 | Invitee accepts | Roster updates; capacity respected |
| E2E-03 | Participant reads/copies challenge + schedule | Copy content matches DB; exact schedule |
| E2E-04 | Volunteer room → search → check-in | Verified record; duplicate blocked |
| E2E-05 | Volunteer flags unregistered | Flagged record; no account created |
| E2E-06 | Coordinator scope + drill-down | Only authorized rooms; counts match |
| E2E-07 | Principal edits schedule + assigns room | Persisted; participant/coordinator see update |
| E2E-08 | Principal creates/publishes new event | Appears in directory; isolated data |
| E2E-09 | Cross-role URL/ID tamper | Denied at every attempt |
| E2E-10 | Mobile 390px full participant + volunteer flows | No overflow; actions reachable |

---

## 19. Execution cadence

- **Per commit:** lint, typecheck, unit tests for touched logic.
- **Per milestone:** build, relevant integration/RLS tests, responsive smoke, manual acceptance.
- **Before M9 gate:** full security/RLS suite.
- **Before demo:** full E2E on the deployed URL, PWA, a11y, performance, demo reset.
- **After any schema/RLS change:** rerun the affected authorization tests; never assume.

---

## 20. Evidence and reporting

For each run record:

- Date, environment, commit hash.
- Commands actually run and their results (exit code/output summary).
- Viewports/screenshots inspected.
- Test IDs passed/failed, with defect severity.
- Known limitations/unverified areas.

Defect severity: **P0** security/data loss/broken core; **P1** primary action broken/major a11y/responsive; **P2** meaningful inconsistency; **P3** polish.

Do not write “tested” or “works” without evidence. Do not commit credentials, tokens, or PII in test artifacts.

---

## 21. Exit criteria for the hackathon demo

- All Must-Have product scenarios pass on the deployed URL.
- AUTHZ-01…18, SEC-01…12, and E2E-01…10 pass (or documented exceptions are accepted by the owner).
- No P0/P1 open defects on primary flows.
- RLS enabled on every table; no permissive policy on operational data.
- Build/typecheck/lint pass.
- Mobile 360/390/430, tablet 768, desktop 1024/1280/1440 inspected.
- Keyboard/focus/labels/contrast/reduced motion checked.
- PWA install/offline cache behavior verified.
- Demo reset and private judge credentials ready.
- Evidence recorded; limitations stated honestly.
