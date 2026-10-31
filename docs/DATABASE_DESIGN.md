# Database Design

## Identity

`app_users` → `profiles`; `auth_sessions`, `email_verification_tokens`, `password_reset_tokens`, `auth_rate_limits`, and `auth_audit_logs` are server-only. Tokens are SHA-256 hashes; passwords are Argon2id hashes created in the application.

## Event authority

`event_memberships(event_id, user_id, role, status)` is the source of role authority. Users may hold multiple event roles. No global role grants event access.

## Domain relationships

- Events → registrations, event schools, memberships, rooms, schedules, challenge, announcements.
- Teams belong to one event and school; team members are unique per event.
- Room assignments bind same-event rooms and teams.
- Volunteer/coordinator assignments define operational scope.
- Check-ins bind event, room, actor, participant/registration/team and use a partial unique index for one verified event check-in.

## Migration state

The SQL is designed for a clean development database. It has not been applied in this task. Do not apply to production or an existing project until ownership, backup, migration impact, and rollback are reviewed.
