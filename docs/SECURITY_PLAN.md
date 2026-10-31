# Historical Security Plan

> **HISTORICAL:** Superseded by `GATIK_EVENTS_MASTER_PROJECT.md` and `docs/SECURITY_REVIEW.md`. Supabase Auth statements below are not current.

**Status:** Design only. No security control has been implemented or tested yet.
**Source of truth for:** threat model, authentication/authorization security, secrets, privacy, audit, headers, and demo-access policy.
**Related:** [RBAC matrix](RBAC_PERMISSION_MATRIX.md) · [Database schema](DATABASE_SCHEMA.md) · [Test plan](TEST_PLAN.md) · [System architecture](SYSTEM_ARCHITECTURE.md)

---

## 1. Security objectives

1. Only authenticated, email-verified users enter the application.
2. A user can access an event only through an active event membership.
3. A user cannot grant themselves a staff role by changing UI state, cookies, URLs, or API payloads.
4. Participants see only their own registration/team and published event content; teammates see shared team data.
5. Volunteers see only their assigned room(s); coordinators see only their assigned rooms/all-room grant; principals see their event.
6. One event's data cannot be reached through another event's identifiers.
7. Check-ins are attributable, duplicate-safe, and cannot be fabricated by participants or outsiders.
8. Invitation tokens are unguessable, expiring, single-use, revocable, and stored only as hashes.
9. Secrets never reach the browser bundle, Git history, logs, screenshots, or demo documents committed to the repository.
10. Security-sensitive changes are auditable without storing unnecessary personal data.

---

## 2. Trust boundaries

| Boundary | Trusted | Untrusted |
|---|---|---|
| Browser | Rendered UI, user's own session | All input, role labels, hidden fields, local storage, API calls |
| Next.js server | Server actions/route handlers with validated session | Request payloads until validated |
| Supabase Auth | Credential verification, email confirmation, session issuance | User metadata until server-validated |
| Supabase Postgres/RLS | Policy enforcement, constraints, RPC invariants | Queries that bypass RLS (service role) are privileged and restricted |
| Resend/SMTP | Delivery | Email content must be generated safely; inbound replies are not trusted |
| Vercel | Hosting/runtime | Environment must be configured; logs must not contain secrets |
| Storage | Event posters/avatars | File type/size/content until validated |

The **service-role key** crosses the highest boundary. It bypasses RLS and must never be imported into a client component, exposed via `NEXT_PUBLIC_*`, logged, or committed.

---

## 3. Threat model

| Threat | Actor | Impact | Mitigation | Verification |
|---|---|---|---|---|
| Self-role elevation | Participant | Access to staff operations | Membership-only authority; no client role grant; RLS; RPC checks; route guards | AUTHZ-01/02/17 |
| IDOR across events | Authenticated user | Read/modify another event | Event-scoped queries; composite FKs; RLS helper checks | AUTHZ-09/16 |
| Volunteer room overreach | Volunteer | Participant privacy/check-in fraud | Room assignment checks in search/roster/check-in RPCs; RLS | AUTHZ-04/05/06 |
| Coordinator overreach | Coordinator | Cross-room operations | `coordinator_assignments` scope, including null=all semantics | AUTHZ-07/08 |
| Duplicate/fraudulent check-in | Participant/volunteer | False attendance | Volunteer-only RPC, room/team verification, unique verified index, audit | AUTHZ-05/06, CHECK-03/04 |
| Invitation token theft/replay | Outsider | Join a team | 32-byte token, SHA-256 hash, expiry, single-use, email/user binding, revoke | INV-05/06/07 |
| Email/account enumeration | Outsider | Privacy | Generic auth responses; scoped invite lookup; rate limits; no public directory | AUTH-07, PRIV-02 |
| Session theft/CSRF | Attacker | Account takeover | Supabase httpOnly cookies, SameSite, secure cookies in prod, origin checks on server actions, short sessions/refresh | SEC-04 |
| XSS | Content author/attacker | Session/data compromise | React escaping; no raw HTML; structured challenge text; sanitize any future markdown; CSP | SEC-05 |
| SQL injection | Authenticated user | Data breach | Parameterized Supabase client/RPC; no dynamic SQL from input; Zod validation | SEC-06 |
| Secret leakage | Developer/agent | Full DB compromise | Server-only env; `.gitignore`; Vercel env; secret scan; no `NEXT_PUBLIC_` secrets | SEC-01/02/03 |
| Open redirect | Attacker | Phishing after login | Relative-path allowlist for `next`; no external redirects | AUTH-08 |
| PWA cache leak | Shared device | Participant data exposure | Cache static assets/offline only; no authenticated HTML/API caching; sign-out clears caches | PWA-04/05 |
| Audit tampering | Insider | Lost accountability | Append-only table; no client writes; definer triggers; principal read-only | AUD-01/02 |
| Brute force/abuse | Outsider | Account/resource abuse | Supabase Auth rate limits; scoped search limits; unique constraints; future edge rate limiting | SEC-07 |
| Malicious upload | Principal/attacker | Stored XSS/resource abuse | MIME/size validation, image-only, no SVG, public bucket read-only, server-side upload policy | SEC-08 |
| Minor's data exposure | Staff/public | Safeguarding/privacy harm | Data minimization, scoped access, no public directory, retention policy, guardian consent decision | PRIV-01/02/03 |

---

## 4. Authentication

### Implementation

- Supabase Auth email/password only; no custom password table or hashing.
- Email confirmation required before event access.
- Password reset via Supabase recovery link; generic "if an account exists" response.
- Session cookies managed by `@supabase/ssr`; refreshed in the Next.js request proxy/middleware.
- Logout clears the Supabase session and client-side caches; redirects to sign-in.
- Profile row created by an `auth.users` trigger; no client-supplied role in metadata is trusted.

### Policies

- Minimum password length: Supabase setting, target 12+ characters; reject compromised/common passwords if Supabase supports the check.
- Verification and reset links redirect only to allowlisted app URLs.
- No magic-link-only flow required; email/password is the product requirement.
- Do not reveal whether an email exists on signup/reset/invite lookup beyond the minimum needed for the flow.
- Auth emails use Resend SMTP; SPF/DKIM/DMARC are configured at the domain, exact records retrieved from Resend/BigRock at deployment.

### Auth tests

Signup, duplicate signup, unverified access, verification callback, login, wrong password, reset request, reset completion, expired link, logout, session refresh, open-redirect attempt.

---

## 5. Authorization and RLS

The full matrix is in [RBAC_PERMISSION_MATRIX.md](RBAC_PERMISSION_MATRIX.md). Security-critical rules:

1. **Membership is authority.** `event_memberships` with `status='active'`; no global role column.
2. **Server guards plus RLS.** Server actions call `requireEventRole` before data access; RLS independently enforces at the database.
3. **Object scope.** A role is not enough; the team/room/registration must belong to the event and be within the role's room/team scope.
4. **Definer functions validate.** Every `SECURITY DEFINER` function pins `search_path`, checks `auth.uid()`, validates event/room/team relationships, and raises safe errors.
5. **Sensitive writes are RPC-only.** Team membership, invitations, check-ins, room assignment, role assignment, and event creation are not direct table writes.
6. **No service role in app runtime.** The authenticated Supabase client is used for user operations. Admin client only in seed/admin scripts with `server-only` and environment isolation.
7. **Last-principal protection.** A trigger/RPC prevents revoking/demoting the last active principal.
8. **Role switching is navigation.** URL role is re-validated; it never changes membership.

### RLS review checklist

- RLS enabled on every table before it is exposed.
- No policy uses `USING (true)` for operational data.
- Policies do not recurse through tables that call the same policy (use definer helpers carefully).
- `UPDATE` policies include both `USING` and `WITH CHECK`.
- Column-level exposure of `token_hash`, phone/email is restricted.
- Anonymous role has no access except the public landing/auth assets.
- Service role is not granted to `authenticated`/`anon`.

---

## 6. Secrets and environment

### Environment variables (names only)

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser-safe anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Seed/admin scripts; never imported into client graph |
| `SUPABASE_DB_URL` | **Server/CLI only** | Migrations; not used at runtime if possible |
| `RESEND_API_KEY` | **Server only** | Application email (invitations/confirmations) |
| `RESEND_FROM_EMAIL` | Server | Verified sender identity |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical app URL for links/redirects |
| `DEMO_STAFF_ACCESS_CODE` | **Server only, optional** | Only if a demo-only staff gate is approved; not authorization |

**Rules**

- `.env.local`, `.env.*.local`, and any credential file are gitignored.
- `.env.example` contains names/placeholders, never real values.
- No secrets in `NEXT_PUBLIC_*`, client components, screenshots, docs, test fixtures, or Git history.
- Rotate any exposed key immediately; Supabase service-role leakage is a full-database incident.
- Vercel environment variables are scoped to Production/Preview/Development; preview deployments do not use production secrets unnecessarily.
- Do not print environment values in build logs or error messages.

---

## 7. Invitation security

- Token: 32 cryptographically random bytes (`gen_random_bytes`) encoded URL-safe.
- Store only `SHA-256(token)`; return the raw token once to the server action that sends the email.
- Bind to `team_id`, `event_id`, `invited_user_id`, and lowercased `invitee_email`.
- Expiry: 7 days default; single-use; status transition on accept/decline/revoke/expire.
- Email link path: `/invitations/[token]`; page sets `Referrer-Policy: no-referrer`, `Cache-Control: no-store`.
- Acceptance requires an authenticated session whose user id/email matches the invitation.
- In-app acceptance uses the invitation id plus the authenticated identity; the token is still validated for email-link acceptance.
- Never log the raw token; redact it from error tracking.
- Rate-limit invitation creation per leader/time window (application-level; future Upstash/edge limiter).
- Do not expose a searchable global user directory to find invitees.

---

## 8. Participant privacy and safeguarding

Gatik Junior College may include minors. The platform stores names, email, phone, school, grade/year, team, room, and check-in status.

- Collect only what the workflow needs. Do not add guardian ID, address, or documents in the MVP.
- Email is read from Supabase Auth; phone is optional unless the institution requires it for operations.
- Volunteers see contact details only for participants in their assigned room.
- Coordinators see their assigned rooms; principals see their event.
- No public participant directory or unauthenticated lookup.
- No PII in URLs (except the invitation token, which is a credential; use no-referrer/no-store).
- No PII in analytics events, audit metadata, or server logs. Use IDs.
- Export/download is not in the MVP; if added, require principal authorization and audit.
- Retention/deletion policy and guardian consent are **not yet decided**; they must be approved before collecting real minor data.
- Demo data must be synthetic; never use real student data or photos.

---

## 9. Audit logging

Audit these actions:

- Role grant/revoke (including principal).
- Event create/update/status transition.
- Room create/update, team-room assignment, volunteer/coordinator assignment.
- Check-in recorded (including flagged outcomes).
- Schedule publish/unpublish.
- Challenge publish.
- Announcement publish.
- Security-sensitive admin changes.

Each entry: actor, event, action, entity type/id, timestamp, and a minimal before/after summary. Never store raw invitation tokens, passwords, JWTs, or unnecessary contact data. Audit rows are append-only; principals can read their event's audit log, but cannot edit/delete it through the app.

---

## 10. Browser and transport security

Target headers (configured at implementation, verified in preview/production):

- `Content-Security-Policy` with nonce/hash-based scripts where feasible; `default-src 'self'`; allow Supabase URL/WebSocket and Supabase Storage images; no arbitrary third-party scripts. `style-src 'self' 'unsafe-inline'` may be required by the component system; document the exception.
- `Strict-Transport-Security` in production (HTTPS only).
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY` / `frame-ancestors 'none'`.
- `Referrer-Policy: strict-origin-when-cross-origin`; `no-referrer` on invitation pages.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` for MVP (revisit QR check-in).
- `Cache-Control: no-store` on authenticated pages and mutation responses.
- Secure, HttpOnly, SameSite cookies in production.

### CSRF / origin

Next.js Server Actions include origin checks. Keep them enabled; do not expose state-changing GET routes. Supabase auth cookies use SameSite. Test cross-origin form posts.

---

## 11. Input validation and output safety

- Validate every server action/RPC payload with Zod (string lengths, UUIDs, enums, dates, email format, allowed transitions).
- Validate on the server even when the client validates.
- HTML forms use native semantics; errors are associated with fields.
- Render challenge/announcement content as plain text or structured sections. If markdown is introduced, sanitize with a maintained sanitizer and test XSS payloads.
- No `dangerouslySetInnerHTML` for user/admin content.
- Supabase parameterized queries; no string-concatenated SQL from request data.
- File uploads: allow `image/jpeg`, `image/png`, `image/webp` only; max 2 MB; reject SVG/HTML; verify magic bytes server-side; public event poster bucket is write-restricted to principals; avatars optional.
- Rate-limit search and invitation endpoints at the application/edge layer; keep result limits small.

---

## 12. PWA security

- Cache static assets and a generic offline page only.
- Never cache authenticated HTML, Supabase responses, participant/check-in data, or admin screens.
- Service worker is network-first/network-only for navigation; offline fallback must not reveal prior user data.
- Sign-out clears app caches and any client-side state.
- No offline check-in in the MVP; queueing sensitive mutations would create conflict/security risk.
- Verify the service worker scope and update flow; a stale worker must not serve a previous user's data on a shared device.

---

## 13. Email security

- Resend domain verification with SPF/DKIM (and DMARC where supported).
- Sender identity matches the verified domain; no spoofed `From`.
- Auth emails are handled by Supabase templates; application emails use the same brand shell.
- Links use the canonical HTTPS app URL, not user-supplied hosts.
- Do not include passwords, tokens in subject lines, or sensitive data beyond the necessary invitation link.
- Bounce/complaint handling is manual in the MVP; monitor Resend dashboard.
- Exact DNS values are retrieved at deployment; this plan does not invent them.

---

## 14. Demo access and credentials

- Real accounts use real passwords; Supabase stores only hashes.
- Demo accounts are synthetic and isolated from real participant data.
- Credentials are generated after accounts exist and stored in a private, gitignored judge guide — never in the public repository, `PROJECT_CONTEXT.md`, or screenshots.
- The user request for a shared "staff dashboard password" is treated as a **demo-only gate proposal**, not authorization. It must not grant a role or replace account login. If approved, implement it as a server-side, rate-limited, environment-configured gate for staff demo accounts only, disabled in production, with no effect on RLS. Recommendation: use per-account credentials and memberships instead; a shared code adds false security and demo friction.
- Judge accounts should be pre-verified and seeded with known roles/rooms so the demo does not depend on inbox delivery.
- Revoke/rotate demo credentials after the event.

---

## 15. Incident response (MVP-scale)

1. **Suspected secret leak:** revoke/rotate Supabase service role and Resend key; review logs; redeploy; invalidate sessions if needed.
2. **Suspected role abuse:** suspend membership, review audit log, correct scope, notify institution owner.
3. **Data exposure:** disable affected route/policy, preserve evidence, notify according to institution policy, patch and retest.
4. **Email abuse:** disable invitation sending, rotate Resend key, review rate limits.
5. **Compromised demo account:** reset password, revoke sessions, remove staff membership, re-seed if necessary.

No formal on-call/SLA exists for the hackathon; the plan is proportionate and must be stated honestly.

---

## 16. Security assumptions and limitations

- Single-institution deployment for the MVP; no institution/tenant table yet.
- Email confirmation depends on Supabase/Resend configuration and deliverability.
- RLS policies are only as good as their tests; they must be exercised with real JWTs, not just inspected.
- Local Supabase testing is constrained because Docker is not installed; a hosted development project or Docker installation is required for full RLS verification.
- Rate limiting is limited to Supabase Auth defaults and application-level checks in the MVP; no dedicated edge limiter.
- No third-party penetration test or formal certification is claimed.
- Browser/assistive-technology coverage is limited to what is actually tested and recorded.
- The demo-only staff code, if implemented, is not a security boundary.
