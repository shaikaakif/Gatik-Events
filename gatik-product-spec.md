# GATIK EVENTS
## Master Product Requirements & Technical Specification

**Product:** Gatik Events  
**Product category:** Campus Activity Management Platform  
**First deployment:** Gatik Xplorer 2026 — Chapter 4  
**Institution:** Gatik Junior College, The Bodhi Tree Campus  
**Location:** Bhanur, Telangana, India  
**Project status:** Hackathon MVP  
**Document version:** 1.0  
**Date:** 31 October 2026

---

# 1. Product Overview

## 1.1 Vision

Gatik Events is a centralized digital platform designed to simplify how educational institutions plan, organize, coordinate, manage and monitor campus activities.

The platform connects students, volunteers, activity coordinators and institutional administrators through a unified application.

Instead of relying on disconnected WhatsApp groups, emails, spreadsheets and paper-based registration, Gatik Events provides a structured environment for managing the entire lifecycle of an event.

## 1.2 First implementation

The first configured event will be:

**Xplorer 2026 — Chapter 4**

A 24-hour student hackathon organized by Gatik Junior College.

The application will be preconfigured with Xplorer 2026 so that judges can experience a realistic, functioning event without having to create one from scratch.

The platform itself must remain event-independent.

Future supported activities should include:

- Annual Day.
- Sports Day.
- Science exhibitions.
- Cultural festivals.
- Workshops.
- Environmental campaigns.
- Inter-college competitions.
- Student club activities.

## 1.3 Core product principle

One application. One authentication system. One centralized database. Multiple role-specific experiences. Multiple events.

---

# 2. Product Objectives

The MVP must demonstrate the following capabilities:

1. Secure user registration and authentication.
2. Email verification.
3. Event discovery.
4. Event-specific role selection.
5. Participant registration.
6. Team creation and membership management.
7. Problem statement presentation.
8. AI-ready problem statement copying.
9. Interactive event schedule.
10. Volunteer-based participant verification.
11. Room and team allocation.
12. Coordinator-level monitoring.
13. Principal-level event administration.
14. Mobile-responsive and installable PWA experience.

## Success criteria

A judge must be able to:

- Create an account.
- Verify their email.
- Discover Xplorer 2026.
- Enter an authorized role.
- Register as a participant.
- Create or join a team.
- Explore the problem statement.
- View the event schedule.
- Experience volunteer verification.
- View coordinator operations.
- Access principal administration.

All critical workflows must use actual application logic and database-backed records.

---

# 3. User Roles and Permissions

The application has four primary roles.

## 3.1 Participant

**Primary responsibility:** Participate in college activities.

Permissions:

- Manage personal profile.
- Register for events.
- Create a team.
- Invite team members.
- Join a team through an invitation.
- View team information.
- View event information.
- Read and copy problem statements.
- View schedules.
- View announcements.
- View registration status.

Restrictions:

- Cannot access volunteer operations.
- Cannot modify room assignments.
- Cannot access administrative functions.
- Cannot assign roles to themselves.

## 3.2 Volunteer

**Primary responsibility:** Ground-level event coordination.

Permissions:

- View assigned event.
- View assigned room.
- View assigned teams.
- Search participants.
- Verify participant registration.
- Report unregistered participants.
- Record check-in information.
- View room occupancy.
- Submit operational updates.
- View event schedule.
- Manage personal profile.

Restrictions:

- Cannot access unrelated rooms unless authorized.
- Cannot create administrative accounts.
- Cannot modify principal-level settings.

## 3.3 Activity Coordinator

**Primary responsibility:** Supervise event operations across rooms.

Permissions:

- View all assigned event rooms.
- View participating teams.
- View participating schools.
- View participant information relevant to operations.
- Monitor volunteer assignments.
- Monitor check-in status.
- Review registration discrepancies.
- Monitor room occupancy.
- View event schedule.
- Access operational summaries.

Restrictions:

- Cannot change global administrative permissions.
- Cannot modify principal-only settings.

## 3.4 Principal / Event Administrator

**Primary responsibility:** Complete event administration.

Permissions:

- Create events.
- Edit events.
- Publish and unpublish events.
- Configure venues.
- Manage schedules.
- View registered schools.
- View participants and teams.
- Create and manage rooms.
- Assign volunteers.
- Assign coordinators.
- Manage event requirements.
- Monitor event statistics.
- Manage event membership and permissions.

---

# 4. Authentication and Entry Flow

## 4.1 Registration

All users use one common authentication system.

Required fields:

- Full name.
- Email address.
- Password.
- Confirm password.

Additional profile details can be collected during onboarding.

Authentication provider: Supabase Auth.

Email delivery: Resend through the configured Supabase SMTP integration.

Requirements:

- Secure password handling through Supabase Auth.
- Email verification.
- Password reset.
- Session management.
- Logout.
- Duplicate account handling.
- Clear loading, error and success states.

The application should not store raw passwords.

## 4.2 Entry workflow

1. User visits Gatik Events.
2. User signs up or logs in.
3. Email verification is completed.
4. User sees the events directory.
5. User selects an available event.
6. User sees the event introduction.
7. User selects an authorized role.
8. Application opens the appropriate dashboard.

The role selection screen must show only roles assigned to the authenticated user for that event.

Participants receive participant access by default after registration. Staff permissions are provisioned or assigned by an authorized administrator.

A user with multiple authorized roles can switch between them through the event workspace.

## 4.3 Role assignment

Use event-specific role assignments.

A person may be a participant in one event and a volunteer in another.

The system must not treat a user-selected role as proof of authorization.

---

# 5. Event Directory

This is the main destination after authentication.

## Interface requirements

Display:

- Application identity.
- Welcome message.
- Search events.
- Event categories.
- Available events.
- Event title.
- Event poster.
- Event dates.
- Venue.
- Event status.
- Short description.
- View event action.

## Initial configuration

The event directory will contain one preconfigured event:

**Xplorer 2026 — Chapter 4**

Status: Active / In Progress, based on actual event state.

Venue: Gatik Junior College, The Bodhi Tree Campus, Bhanur.

Dates: October 31 – November 1, 2026.

The event must be seeded through the database, not hardcoded into the dashboard.

Future events should appear automatically from the same database.

---

# 6. Participant Dashboard

## 6.1 Main navigation

- Overview
- My Team
- Problem Statement
- Event Schedule
- Profile

## 6.2 Overview

Display:

- Event identity.
- Participant's name.
- Registration status.
- Team information.
- Event dates.
- Next scheduled activity.
- Important announcements.
- Quick actions.

## 6.3 Participant onboarding

Collect:

- Full name.
- Phone number.
- School or college name.
- Email address from authenticated account.
- Relevant student details.
- Event-specific information.

Do not repeatedly ask for information already stored in the user's profile.

## 6.4 Team management

A participant can create a team.

Team creation fields:

- Team name.
- Participating school.
- Team description (optional).
- Team leader.
- Team member invitations.

The team leader can invite other registered participants.

The application must verify:

- Whether the invited user exists.
- Whether the user is already part of another team for the same event.
- Whether the team has reached its permitted size.
- Whether the invitation is valid.
- Whether the user has accepted.

The configured team size must follow the event's rules. The hackathon brief indicates a team size of 2–5 participants; make this configurable at the event level.

All members see the same team workspace.

The team leader receives additional management permissions.

## 6.5 Problem Statement

Create a dedicated, well-designed reading experience.

Content structure:

1. Challenge title.
2. The Challenge.
3. Your Challenge.
4. Minimum Expected Outcome.
5. Think Beyond the MVP.
6. Evaluation Criteria.

The complete source content must be preserved.

### Copy functionality

Provide two distinct actions:

**Copy Problem Statement**

Copies the complete formatted problem statement.

**Copy AI Context**

Copies a prepared prompt containing:

- Product challenge.
- Problem description.
- Minimum expected outcome.
- Evaluation criteria.
- Relevant event context.

The copied content must be generated from the actual event's stored problem statement.

Provide copy-success feedback.

## 6.6 Profile

Allow participants to:

- View personal details.
- Edit permitted fields.
- Update phone number.
- View email verification status.
- View team membership.
- View event participation history.
- Sign out.

---

# 7. Volunteer Dashboard

## 7.1 Operational context

Current Xplorer configuration:

- 6 rooms.
- 12 teams.
- Approximately 2 teams per room.
- One assigned volunteer per room.

These are the initial event configuration values and must remain editable by authorized administrators.

## 7.2 Main navigation

- Overview
- My Room
- Teams
- Participant Verification
- Event Schedule
- Profile

## 7.3 Volunteer overview

Display:

- Assigned room.
- Assigned teams.
- Participant count.
- Verified participants.
- Pending verification.
- Recent check-ins.
- Operational alerts.

## 7.4 Room management

A volunteer should see only their authorized room assignments.

For example:

Room 1:
- Team A.
- Team B.
- Participating school.
- Team members.
- Registration status.
- Check-in status.

## 7.5 Participant verification

Provide a searchable interface.

Search using:

- Participant name.
- Registered email.
- Phone number.
- Team name.

Verification workflow:

1. Volunteer enters participant information.
2. Application searches the event's participant records.
3. Matching records are displayed.
4. Volunteer confirms the correct participant.
5. Application checks registration status.
6. Volunteer records the check-in.
7. The system records the timestamp and volunteer identity.

Possible outcomes:

- Registered.
- Not registered.
- Already checked in.
- Duplicate or ambiguous match.
- Pending verification.

Unregistered participants must be flagged for follow-up.

The application must not silently create a new verified participant simply because a volunteer enters a name.

## 7.6 Operational records

Each check-in record should contain:

- Event ID.
- Participant ID, where available.
- Room ID.
- Volunteer ID.
- Verification status.
- Check-in timestamp.
- Notes, if necessary.

---

# 8. Activity Coordinator Dashboard

## 8.1 Main navigation

- Overview
- Rooms
- Teams
- Schools
- Volunteers
- Event Schedule
- Profile

## 8.2 Overview

Display:

- Total rooms.
- Total teams.
- Total schools.
- Total participants.
- Verified participants.
- Pending registrations.
- Active volunteers.

Every number must come from actual database queries.

## 8.3 Room management

Display six configured rooms in the initial event.

Each room shows:

- Room identifier.
- Assigned volunteer.
- Allocated teams.
- Participating schools.
- Number of team members.
- Check-in status.
- Occupancy.

## 8.4 Navigation hierarchy

Coordinator → Room → Team → School → Participants.

The coordinator must be able to drill down from a room into its teams, and from each team into its school and individual members.

## 8.5 Volunteer management

Display:

- Volunteer identity.
- Assigned room.
- Assigned teams.
- Check-in activity.
- Current assignment status.

---

# 9. Principal Dashboard

## 9.1 Main navigation

- Overview
- Events
- Participants
- Schools
- Teams
- Rooms
- Volunteers
- Coordinators
- Event Schedule
- Settings
- Profile

## 9.2 Overview

Display:

- Total events.
- Active events.
- Registered schools.
- Total teams.
- Total participants.
- Volunteer count.
- Room utilization.
- Event activity.

## 9.3 Event creation

The principal can create an event with:

- Event name.
- Event slug.
- Event description.
- Event category.
- Event poster.
- Start date.
- End date.
- Registration start.
- Registration deadline.
- Venue.
- Event status.
- Team size rules.
- Event capacity.
- Event-specific requirements.

## 9.4 Event lifecycle

Use clear event statuses:

- Draft.
- Published.
- Registration Open.
- Registration Closed.
- In Progress.
- Completed.
- Archived.

Transitions must be validated.

## 9.5 Event schedule management

The principal can:

- Create schedule items.
- Edit activity names.
- Set start and end times.
- Assign locations.
- Add descriptions.
- Change sequence.
- Publish schedule updates.

## 9.6 Room management

The principal can:

- Create rooms.
- Rename rooms.
- Configure capacity.
- Assign teams.
- Assign volunteers.
- Reassign teams.
- View occupancy.

## 9.7 Staff management

The principal can assign event-specific permissions to:

- Volunteers.
- Activity coordinators.
- Other administrators.

Role assignment must be audited.

---

# 10. Event Schedule Experience

The Xplorer schedule should be converted from a static PDF into a structured, interactive timeline.

## October 31, 2026

| Time | Activity |
|---|---|
| 8:30–8:45 AM | Student reporting |
| 9:00–9:30 AM | Registration and room escorting |
| 9:30 AM | Guest arrival |
| 9:50 AM | Ceremony starts |
| 10:30 AM | 15-minute break |
| 10:45–11:45 AM | Workshop |
| 11:45 AM | Coding begins |
| 1:15–2:00 PM | Lunch |
| 2:00–3:00 PM | Coding continues |
| 3:00–3:20 PM | Break |
| 3:20–6:30 PM | Coding continues |
| 6:30–8:30 PM | Dinner, band and flashmob |

Additional schedule information:

- Rooms with beds and materials for rest.
- Midnight snacks, tea and coffee around 2:30–3:00 AM.

## November 1, 2026

| Time | Activity |
|---|---|
| 7:30–8:00 AM | Breakfast |
| 8:00–9:30 AM | Presentation preparation |
| 9:30–10:00 AM | Ceremony and guest addressing |
| 10:00 AM | Participants report to auditorium |
| 10:30 AM | Judging begins |
| During judging | Snacks provided |
| 12:30 PM | Closing ceremony |
| After lunch | Felicitation, awards, closure and dispersal |

All timestamps must be stored with the event's timezone. Use Asia/Kolkata for Xplorer.

Do not invent missing activities or exact times.

---

# 11. Design System

## 11.1 Visual direction

**Light-first, modern, institutional, premium and approachable.**

The application should combine:

- Gatik's established navy and orange identity.
- Xplorer's purple event identity.
- A restrained lime accent from the event's promotional visuals.

The design should feel like a professional campus management product, not a generic AI dashboard.

## 11.2 Proposed design tokens

| Token | Value | Usage |
|---|---|---|
| Background | #F7F8FC | Main page |
| Surface | #FFFFFF | Panels |
| Surface muted | #F0F2F7 | Secondary areas |
| Primary navy | #193E69 | Brand identity |
| Primary accent | #28558B | Primary controls |
| Gatik orange | #F07835 | Brand highlights |
| Event violet | #8152D8 | Xplorer identity |
| Lavender | #B69AF3 | Secondary highlights |
| Event lime | #91CB58 | Limited event accents |
| Foreground | #202534 | Main text |
| Muted | #70798A | Secondary text |
| Border | #E3E6EE | Dividers |

These are proposed starting tokens. Validate contrast before finalizing.

## 11.3 UI techniques

Use selectively:

- Glassmorphism for appropriate overlays.
- Soft surfaces.
- Subtle gradient backgrounds.
- Aurora-inspired accents.
- Carefully designed shadows.
- Refined border treatments.
- Smooth micro-interactions.
- Animated state transitions.
- Premium form controls.
- Clean dashboard layouts.

Do not use dark cyberpunk styling as the primary application theme.

## 11.4 Typography

Use a consistent typography system.

Suggested direction:

- Inter or another suitable modern sans-serif for application UI.
- Distinctive display typography for event headings only when useful.
- Clear hierarchy for page titles, sections, body text, labels and metadata.

## 11.5 Motion

Animations should improve:

- Feedback.
- Navigation.
- Orientation.
- State transitions.
- Perceived continuity.

Avoid constant animated backgrounds, excessive blur, unnecessary parallax and motion that harms performance.

Honor `prefers-reduced-motion`.

## 11.6 Responsive design

Design mobile-first.

Required test widths:

- 360px.
- 390px.
- 430px.
- 768px.
- 1024px.
- 1280px.
- 1440px.

The participant and volunteer dashboards must work especially well on phones.

Administrative dashboards may use wider tables and desktop navigation, with a deliberate mobile layout.

---

# 12. Technical Architecture

## 12.1 Preferred stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | Existing compatible component system |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Authorization | Supabase Row Level Security |
| Email | Resend via Supabase SMTP |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Source control | GitHub |
| Application format | Progressive Web App |

Inspect existing project versions before selecting dependencies.

## 12.2 Application architecture

Use a modular architecture.

Suggested modules:

- Authentication.
- User profiles.
- Events.
- Event memberships.
- Participants.
- Teams.
- Schools.
- Rooms.
- Volunteers.
- Coordinators.
- Check-ins.
- Schedules.
- Announcements.
- Administration.

Business logic must not be duplicated across role-specific dashboards.

## 12.3 Database entities

Initial proposed schema:

### Identity

- profiles
- user_preferences

### Events

- events
- event_memberships
- event_settings
- event_announcements

### Participants

- schools
- registrations
- participants

### Teams

- teams
- team_members
- team_invitations

### Operations

- rooms
- room_assignments
- check_ins
- volunteer_assignments

### Scheduling

- schedules
- schedule_items

### Governance

- audit_logs

Every event-specific entity should have an appropriate event relationship.

Use UUID primary keys, foreign keys, unique constraints and indexes.

Use appropriate database constraints to prevent:

- Duplicate team memberships.
- Duplicate event registrations.
- Invalid room assignments.
- Duplicate check-in operations.
- Unauthorized role assignments.

The schema must be normalized appropriately and documented.

---

# 13. Authorization and Security

Security is part of the MVP, not a future enhancement.

Requirements:

1. Supabase authentication.
2. Verified email accounts.
3. Event-specific role assignments.
4. Row Level Security.
5. Server-side authorization.
6. Validated database operations.
7. Restricted administrative actions.
8. Protected environment variables.
9. No service-role key in client-side code.
10. No passwords stored in application tables.
11. Minimal exposure of participant personal information.
12. Auditable staff permission changes.

A participant must not be able to access another team's private data unnecessarily.

A volunteer must not access unrelated room operations.

An administrator's access must be enforced by server-side permissions and database policies, not merely by hiding UI elements.

---

# 14. Email and Notifications

Use Resend for transactional email delivery through the configured authentication email provider.

Required initial email workflows:

- Email verification.
- Password reset.
- Team invitation.
- Team invitation acceptance notification.
- Registration confirmation.

Future enhancements:

- Schedule change notification.
- Event announcement.
- Room assignment notification.
- Event reminders.

Email templates should be branded consistently with Gatik Events.

Configure the custom domain's required DNS records through BigRock when deployment is ready.

Never place SMTP credentials or API keys in the repository.

---

# 15. PWA Requirements

The application should be installable on supported mobile and desktop devices.

Requirements:

- Web app manifest.
- Application icons.
- Appropriate theme color.
- Standalone display mode.
- Responsive layouts.
- Service worker where suitable.
- Update handling.
- Offline fallback for safe, non-sensitive static information.

Do not cache sensitive participant data or administrative responses in public caches.

Offline check-in is not part of the initial MVP unless its synchronization and conflict behavior can be safely implemented.

---

# 16. Demo Environment

Prepare a controlled judge environment.

Suggested accounts:

| Account | Role |
|---|---|
| Principal Demo | Principal |
| Coordinator Demo | Activity Coordinator |
| Volunteer Demo 1–6 | Assigned volunteers |
| Participant Demo 1 | Participant |
| Participant Demo 2 | Participant |
| Participant Demo 3 | Participant |

These are account labels, not real credentials.

Credentials must be generated only after accounts are created.

Create a separate Judge Access Guide containing:

- Application URL.
- Account email.
- Temporary password.
- Assigned role.
- Assigned room, if applicable.
- Instructions for login.
- Expected demo workflow.

Use isolated demo accounts and synthetic participant data.

Do not publish demo credentials in the public GitHub repository.
Prepare a markdown file and list all these credentials for these rules That means if a volunteer wants to login they will have they are already verified email but they dont have access to the dashboard until and unless Put a particular password  So that particular password I want you to give for The above has said one to six volunteers And some activity coordinators And principal credentials So a few things That will be that are done for this application only which can be used to access the dashboard 
 
---

# 17. MVP Scope and Prioritization

## Must have

- Authentication.
- Email verification.
- Events directory.
- Event role selection.
- Participant profile.
- Participant registration.
- Team creation.
- Team membership.
- Problem statement.
- AI context copying.
- Event schedule.
- Volunteer dashboard.
- Participant verification.
- Room assignments.
- Coordinator dashboard.
- Principal dashboard.
- Event configuration.
- Database-backed records.
- RLS.
- Responsive design.

## Should have

- Team invitations.
- Search and filtering.
- Announcement display.
- Registration reports.
- Check-in history.
- PWA installation.
- Judge access guide.

## Future roadmap

- QR-based check-in.
- Advanced analytics.
- Equipment inventory.
- Resource allocation.
- Certificate generation.
- Multiple campus support.
- Automated notifications.
- Attendance reports.
- Advanced event templates.
- Public event registration pages.

---

# 18. Evaluation Criteria Alignment

The hackathon's official evaluation weights:

| Evaluation area | Weight |
|---|---:|
| Problem understanding | 10% |
| User experience and UI design | 20% |
| Data/domain modeling | 10% |
| Solution approach and execution | 30% |
| Working solution and end-to-end demo | 20% |
| Innovation, extensibility and roadmap | 10% |

Our implementation must directly demonstrate each criterion.

Prioritize complete workflows over a large number of unfinished features.

---

# 19. End-to-End Acceptance Scenarios

## Scenario A — Participant

Given a new participant:

1. Registers.
2. Verifies email.
3. Logs in.
4. Selects Xplorer 2026.
5. Selects Participant.
6. Completes profile.
7. Creates a team.
8. Invites another participant.
9. Views the problem statement.
10. Copies AI context.
11. Views the event schedule.

Expected result: actual records are created and the participant can see their team.

## Scenario B — Volunteer

Given an assigned volunteer:

1. Logs in.
2. Selects Xplorer 2026.
3. Selects Volunteer.
4. Opens assigned room.
5. Searches for a participant.
6. Verifies registration.
7. Records check-in.

Expected result: the check-in is stored and visible to authorized coordinators.

## Scenario C — Coordinator

Given an authorized coordinator:

1. Logs in.
2. Selects Xplorer 2026.
3. Selects Coordinator.
4. Views six rooms.
5. Opens a room.
6. Views its assigned teams.
7. Opens a team.
8. Views its school and participants.
9. Reviews check-in status.

Expected result: the coordinator sees consistent operational data.

## Scenario D — Principal

Given an authorized principal:

1. Logs in.
2. Selects Xplorer 2026.
3. Selects Principal.
4. Views event statistics.
5. Opens room management.
6. Reviews teams and schools.
7. Reviews volunteers.
8. Edits a schedule item.
9. Publishes the change.

Expected result: the authorized update is persisted and visible to relevant users.

## Scenario E — Future event

Given the principal:

1. Creates another event.
2. Adds its schedule.
3. Configures team rules.
4. Publishes the event.

Expected result: the event appears in the directory without creating a separate application.

---

# 20. Definition of Done

The MVP is considered ready when:

- Authentication works.
- Email verification works.
- Role selection respects authorization.
- Participant registration works.
- Team creation and invitations work.
- Problem statement is complete.
- Copy actions work.
- Event schedule is accurate.
- Volunteer verification works.
- Room assignments work.
- Coordinator monitoring works.
- Principal administration works.
- Data persists in Supabase.
- RLS policies are tested.
- Mobile layouts work.
- Important error and loading states exist.
- Build and type checks pass.
- Critical workflows have been tested.
- Judge credentials are prepared.
- Deployment is accessible through the configured domain.

No functionality should be declared complete without evidence.

---

# 21. Reference Materials

The following sources govern the product:

1. Gatik Xplorer 2026 hackathon problem statement supplied by the user.
2. Official evaluation criteria image supplied by the user.
3. Gatik Junior College branding assets supplied by the user.
4. Xplorer promotional artwork supplied by the user.
5. Uploaded Xplorer event schedule PDF.
6. Uploaded `master-ui-skill` version 1.0.

Use the supplied materials as the source of truth for event content and branding.

Do not invent event schedules, participant records, credentials, statistics or institutional policies.

**End of Product Specification.**