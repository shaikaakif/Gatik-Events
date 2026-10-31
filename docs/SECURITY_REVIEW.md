# Security Review

**Status:** IN PROGRESS — code review and public-browser checks complete for the current slice; database/runtime penetration evidence pending.

## Implemented controls

- Argon2id password hashing through maintained native bindings.
- Random 32-byte opaque tokens; SHA-256 token hashes at rest.
- HttpOnly, Secure-in-production, SameSite=Lax session cookie.
- Session expiry/revocation and password-reset session invalidation.
- Generic login/reset/resend responses and database-backed rate-limit records.
- Safe internal redirect validation.
- Five-minute ES256 RLS JWT with `kid`, `sub`, and `role=authenticated`.
- Service-role and signing private key remain server-only.
- RLS/grants deny operational tables by default; published public content is explicit.
- Static-only service-worker cache; no authenticated navigation/API caching.
- Security headers: HSTS, frame denial, nosniff, restrictive permissions/referrer policies.

## Not yet proven

- Migrations/RPCs/RLS on real PostgreSQL.
- Concurrent token/team/check-in behavior.
- Resend delivery, bounce, SPF/DKIM/DMARC.
- JWT import/rotation and PostgREST acceptance in the selected project.
- CSRF/open-redirect/IDOR automated integration suite.
- Privacy/retention/consent compliance.
- CSP suitable for production.

## Release gate

Do not collect real student data or deploy production until the unproven items affecting auth, RLS, privacy, and sender/domain configuration are resolved.
