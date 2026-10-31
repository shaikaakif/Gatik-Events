# Next Task

## TASK ID

`GATIK-M3-M4-INTEGRATION-001`

## Goal

Prove the clean schema, custom JWT, authentication lifecycle, and RLS against a new development Supabase project.

## Owner inputs required

1. Confirm a new development Supabase project (recommended) or explicitly approve reuse.
2. Configure secrets privately in `.env.local`/Vercel; do not send them in chat.
3. Import the generated ES256 signing key into the development project.
4. Configure a verified Resend sender.

## Acceptance

- Migrations apply from zero.
- Seed completes and invariant counts are queried.
- Signup → verification → login → role routing works.
- Expired/reused tokens fail.
- Event A/Event B, role, and room-scope negative tests pass.
- Service worker never caches authenticated HTML/API data.

## Stop conditions

Any existing production data, key rotation affecting another application, missing backup, or unknown project ownership.
