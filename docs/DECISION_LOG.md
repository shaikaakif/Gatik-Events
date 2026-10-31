# Decision Log

| ID | Date | Decision | Evidence/state |
|---|---|---|---|
| D-001–D-012 | 2026-10-31 | Product identity, journey, roles, palette, PWA, exact icon source, clean code/SQL, continuity, and removal of Supabase Auth | CONFIRMED by owner blueprint |
| D-013 | 2026-10-31 | Use imported ES256 custom JWTs with `sub`, `role=authenticated`, and short expiry for Supabase RLS | VERIFIED against current official Supabase JWT/signing-key/RLS docs; not integration-tested |
| D-014 | 2026-10-31 | Next.js + TypeScript + Tailwind + Supabase Postgres + Resend + Vercel | IMPLEMENTED baseline; deployment unverified |
| D-020 | 2026-10-31 | Browser stores only an opaque HttpOnly session token; server stores SHA-256 token hash and mints a 5-minute database JWT | IMPLEMENTED; integration test pending |
| D-021 | 2026-10-31 | Public visitors may read only non-draft event facts, published schedule items, and published challenge content | IMPLEMENTED in migration; DB test pending |
| D-022 | 2026-10-31 | Seed users are disabled `.invalid` synthetic fixtures with no committed credentials | IMPLEMENTED |

## Unresolved

- Development Supabase project choice/reuse permission.
- Official G Group wordmark asset/rights.
- Official Xplorer challenge content.
- Resend sender identity.
- Privacy/retention/consent policy.
- Production DNS records and cutover date.
