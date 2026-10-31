# Release Checklist

## Code and data

- [ ] Lint, typecheck, unit, E2E, and production build pass in release commit.
- [ ] Migrations apply to clean development PostgreSQL.
- [ ] RLS positive and negative tests pass.
- [ ] Backup and rollback are tested before any reused-project migration.
- [ ] Official event, schedule, organizer, venue, and challenge content are verified.

## Auth and email

- [ ] ES256 key is imported/rotated in the approved project.
- [ ] Verification, login, reset, logout, revocation, expiry, reuse, rate limit, CSRF, and redirect tests pass.
- [ ] Resend sender/domain and SPF/DKIM/DMARC are verified.
- [ ] Production email links use `https://g-events.shaikaakif.com`.

## UI and PWA

- [ ] Screenshots inspected at 360, 375, 390, 430, 768, 1024, 1440.
- [ ] Keyboard, focus, contrast, labels, reduced motion, and touch targets reviewed.
- [ ] Android install and iOS Add to Home Screen behavior observed.
- [ ] Exact Gatik source-derived icons displayed correctly.
- [ ] Offline fallback contains no private data; authenticated responses are absent from caches.

## Cutover

- [ ] Preview is owner-approved.
- [ ] Environment variables configured without exposing values.
- [ ] Exact Vercel DNS records obtained—none invented.
- [ ] Owner explicitly approves production deployment and hostname attachment.
- [ ] TLS, redirects, manifest, icons, email links, logs, and rollback verified after cutover.
