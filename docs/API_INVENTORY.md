# API and Service Inventory

| Boundary | Purpose | Authentication | Status |
|---|---|---|---|
| Next.js Server Actions | Auth, registration, teams, operations, administration | Opaque HttpOnly session + server guard | IMPLEMENTED; integration pending |
| `GET /auth/verify` | Consume email verification token and establish session | Single-use random token, hash at rest | IMPLEMENTED |
| `GET /api/health` | Deployment health | Public; no secrets | IMPLEMENTED |
| Supabase Data API | Postgres reads/RPCs | Publishable key plus short-lived ES256 user JWT; public reads use anon | IMPLEMENTED; integration pending |
| Resend Emails API | Verification, reset, invitations | Server-only API key | IMPLEMENTED; sender/delivery unverified |
| Vercel | Preview/production runtime | Owner account/project | NOT STARTED |

No browser component receives the Supabase service-role key, Resend key, session token hash, or JWT private key.
