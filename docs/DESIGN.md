# Gatik Events — Design System and UI Plan

**Status:** Design plan only. No rendered UI exists yet; no screenshot or accessibility result is claimed.
**Source of truth for:** visual direction, tokens, typography, components, navigation, screen inventory, motion, accessibility, responsive behavior, and visual QA.
**Related:** [Product spec](PRODUCT_SPEC.md) · [User flows](USER_FLOWS.md) · [Roadmap](IMPLEMENTATION_ROADMAP.md)

Applied skill: **`master-ui-skill` v1.0** (loaded and followed: repository reconnaissance, direction selection, token discipline, accessibility, motion, and visual QA). No external component libraries or assets are installed.

---

## 1. Design brief

**Product:** A campus activity management platform used by participants, volunteers, coordinators, and a principal before, during, and after an event.

**Primary jobs**

- Participant: know what to do next; form a team; read/copy the challenge; follow the schedule.
- Volunteer: find the right participant in my room; verify; check in; flag exceptions.
- Coordinator: understand room/team/school status and drill into problems.
- Principal: run the event and change configuration without ambiguity.

**Tone:** calm, institutional, precise, approachable, quietly premium. Not playful-childish, not cyberpunk, not a dark developer console.

**Constraints:** light-first; mobile field use; one coherent system; WCAG 2.2 AA target; no fabricated data; no dark mode in the MVP.

---

## 2. Visual direction: “Institutional Expedition”

### One-sentence direction

A light, editorial campus operations system that borrows the language of an expedition field guide — navy structure, a fine route line, numbered waypoints, and restrained violet event energy — so every screen feels like part of one journey rather than a generic dashboard.

### Why this direction

- **Gatik navy + orange** carry institutional trust and wayfinding.
- **Xplorer violet/lavender** distinguishes the event without turning the whole product purple.
- **Route/waypoint motif** connects the participant journey (register → team → challenge → schedule) and the coordinator hierarchy (room → team → school → participant).
- **Paper-like surfaces and fine rules** feel premium and legible under venue lighting; they avoid the dark, glare-heavy dashboard default.
- **Editorial typography** gives the event and challenge a sense of occasion while the UI font keeps dense operations readable.

### Signature element

A **1px route line with small circular waypoint nodes**. It appears in:

- the participant “Your trail” progress;
- the schedule timeline;
- room/team breadcrumb drill-downs;
- the event hero as a faint topographic/route composition.

It is a navigation and orientation device, not decoration on every card.

### Anti-template rules

- No giant gradient hero followed by three identical cards.
- No card-wrapped card stacks.
- No glow on every surface.
- No icon tile above every heading.
- No purple gradient applied indiscriminately; violet is an event accent, not the product’s only color.
- No dark mode by inversion.
- No decorative motion loops.
- No fake metrics, logos, testimonials, or stock student photos.

### Composition references (principles, not copies)

- Institutional annual-report layouts: strong margins, fine rules, restrained color.
- Field guides and trail maps: sequence, legend, waypoints, labels.
- Modern editorial product UI: large serif event titles + compact sans UI.
- Operational control rooms: status boards and exceptions, not vanity charts.

---

## 3. Color system

### 3.1 Starting tokens (validated)

The product brief’s starting values were tested. The original muted `#70798A` fails AA on white (4.38:1) and on the page background (4.13:1), so it is **not** used for normal text. The working system uses `#5B6475`. Orange `#F07835` is decorative/wayfinding only on light surfaces (2.82:1 on white); accessible orange text uses `#A34E14`. Lavender/lime are decorative, not text colors.

```css
:root {
  /* Page and surfaces */
  --background: #F7F8FC;
  --surface: #FFFFFF;
  --surface-muted: #F0F2F7;
  --surface-lavender: #F3EEFF;
  --surface-peach: #FFF3EA;
  --surface-navy: #193E69;

  /* Institutional identity */
  --primary: #193E69;
  --primary-accent: #28558B;
  --gatik-orange: #F07835;        /* decorative fill / wayfinding */
  --gatik-orange-ink: #A34E14;    /* accessible orange text */

  /* Event identity */
  --event-violet: #8152D8;
  --event-violet-strong: #6B4BC4;
  --event-lavender: #B69AF3;      /* decorative */
  --event-lime: #91CB58;          /* decorative / progress only */

  /* Text */
  --foreground: #202534;
  --muted-foreground: #5B6475;

  /* Lines and controls */
  --border: #E3E6EE;
  --border-strong: #7C8799;       /* input/control boundary, 3.4:1 on bg */
  --focus-ring: #28558B;
  --focus-ring-on-dark: #FFFFFF;

  /* Status */
  --success: #2F6B3A;
  --success-surface: #EAF4EC;
  --warning: #8A5A00;
  --warning-surface: #FFF4E5;
  --danger: #B42318;
  --danger-surface: #FDECEA;
  --info: #28558B;
  --info-surface: #EAF1F9;
}
```

### 3.2 Measured contrast

| Pair | Ratio | Use |
|---|---:|---|
| `#202534` on `#F7F8FC` | 14.38:1 | Body text |
| `#202534` on `#FFFFFF` | 15.27:1 | Body text on panels |
| `#5B6475` on `#FFFFFF` | 5.96:1 | Secondary text |
| `#5B6475` on `#F7F8FC` | 5.61:1 | Secondary text on page |
| `#193E69` on `#FFFFFF` | 10.86:1 | Navy text/primary |
| `#FFFFFF` on `#193E69` | 10.86:1 | Primary button |
| `#FFFFFF` on `#28558B` | 7.60:1 | Accent button |
| `#FFFFFF` on `#8152D8` | 5.08:1 | Event primary button |
| `#FFFFFF` on `#6B4BC4` | 6.12:1 | Strong violet text/button |
| `#A34E14` on `#FFFFFF` | 5.74:1 | Orange text accent |
| `#202534` on `#F07835` | 5.41:1 | Dark text on orange fill |
| `#2F6B3A` on `#FFFFFF` | 6.39:1 | Success text |
| `#8A5A00` on `#FFFFFF` | 5.93:1 | Warning text |
| `#B42318` on `#FFFFFF` | 6.57:1 | Danger text |
| `#7C8799` on `#F7F8FC` | 3.42:1 | Control boundary (non-text) |

**Rules**

- Never use lime or lavender for text or as the sole status signal.
- Orange fills carry navy/foreground text; orange text uses `--gatik-orange-ink`.
- Status always includes text/icon, not color alone.
- Decorative borders may use `--border`; essential input/control boundaries use `--border-strong`.
- Focus uses a 2–3px ring with an offset; on navy/violet surfaces use a white ring.
- Re-test contrast after any token change; this table is a planning baseline, not a substitute for rendered checks.

### 3.3 Color assignment by role

| Surface/role | Primary accent | Secondary | Notes |
|---|---|---|---|
| Global/institutional | Navy | Orange wayfinding | Navigation, primary actions, institution identity |
| Xplorer event | Violet | Lavender + lime (restrained) | Event hero, event chips, challenge copy action |
| Participant | Navy + violet | Lime progress | Journey/team/schedule |
| Volunteer | Navy | Orange “field” highlights | Room/verification is operational, not event-decorative |
| Coordinator | Navy | Violet room-status accents | Dense but calm |
| Principal | Navy | Orange serious actions, violet event identity | Governance, lifecycle, audit |

---

## 4. Typography

### Families

- **UI / body:** **Manrope** variable (400, 500, 600, 700). Fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Display / event titles:** **Instrument Serif** regular + italic. Fallback: `Georgia, "Times New Roman", serif`.
- Both are Google Fonts, loaded with `next/font` (self-hosted at build). No external font request at runtime.

Why this pairing: Manrope is compact and highly legible in operational tables/forms; Instrument Serif gives event/challenge pages an editorial, human, institutional voice without turning the product into a marketing site. Avoid using a serif for controls, dense data, or small labels.

### Type scale

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display-xl` | `clamp(3rem, 6vw, 5.5rem)` / 0.98 | 400 serif | Event hero title |
| `display-lg` | `clamp(2.25rem, 4.5vw, 4rem)` / 1.02 | 400 serif | Event intro/challenge title |
| `display-md` | `clamp(1.8rem, 3vw, 2.75rem)` / 1.08 | 400 serif | Auth/role page title |
| `title-lg` | 1.75rem / 1.2 | 700 sans | Page title |
| `title-md` | 1.375rem / 1.3 | 700 sans | Section title |
| `title-sm` | 1.125rem / 1.35 | 650 sans | Card title |
| `body-lg` | 1.0625rem / 1.65 | 400 | Challenge reading |
| `body` | 0.9375rem / 1.6 | 400 | Default |
| `body-sm` | 0.875rem / 1.5 | 400 | Supporting copy |
| `label` | 0.8125rem / 1.3 | 600 | Controls/metadata |
| `caption` | 0.75rem / 1.4 | 500 | Timestamps/help |
| `numeric` | tabular-nums | 600 | Counts/times/tables |

- Max reading measure: 68–74ch for challenge/announcement prose.
- Page titles use sans (operational clarity); event/challenge hero uses serif (occasion).
- Avoid all-caps except small overline labels with letter-spacing ≤0.08em.
- Respect browser zoom; no fixed-height text containers.

---

## 5. Layout, spacing, and shape

### Spacing

4px base; scale `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`. Section gaps 32–48 desktop, 24–32 mobile. Related items closer than unrelated items.

### Grid and containers

- App shell: 264px sidebar desktop; content max-width 1280px; reading views 760px.
- Dashboard grids use `minmax(0, 1fr)` and content-driven breakpoints.
- Mobile: single column with 16px page padding; 12px inside dense cards.
- Tables: horizontal scroll only when unavoidable; alternative stacked record cards on phones for participant/team lists.
- Sticky bars must not cover focused content; account for safe areas.

### Shape and elevation

- Radii: `6px` controls, `10px` compact cards, `14px` panels, `20px` feature/hero surfaces, `999px` pills.
- Borders: 1px `--border`; stronger `--border-strong` for inputs.
- Shadows: `0 1px 2px rgb(32 37 52 / .04)` for resting panels; `0 12px 32px rgb(32 37 52 / .08)` for dialogs; avoid shadow on every card.
- Event surfaces may use a subtle lavender wash and fine route-line pattern; admin surfaces stay mostly white/paper.

### Light-first surface hierarchy

1. Page: `--background` (#F7F8FC).
2. Panel: white.
3. Muted section: `--surface-muted`.
4. Event tint: `--surface-lavender` / `--surface-peach`.
5. Navy: only for primary CTA, brand mark, or a deliberate footer/rail; not a default page background.

### Glass and gradients

- Glass only for the mobile sticky header and dialog overlays; must maintain contrast and have a solid fallback.
- Event hero gradient: `linear-gradient(135deg, #F7F3FF 0%, #EEF4FF 52%, #FFF7F1 100%)` with a 4% opacity route/topographic SVG.
- No animated aurora, no gradient text, no gradient behind dense tables.

---

## 6. Component system

Use shadcn/ui source + Radix primitives, tailored to these tokens. One icon family: Lucide, 1.5px stroke, sizes 16/18/20/24.

### Primitives

| Component | Variants / behavior |
|---|---|
| Button | `primary` navy, `event` violet, `secondary` white/border, `ghost`, `danger`; sizes 36/44/48; loading spinner preserves width; focus-visible; disabled reason |
| IconButton | 44px target; accessible name; tooltip optional |
| Input / Textarea / Select | Persistent label, help text, error association, `aria-describedby`, strong border, 44px min height |
| Checkbox / Radio | Large target; text label; focus ring; not color-only |
| Badge / StatusPill | Neutral, info, success, warning, danger, event; dot + text; no status by color alone |
| Card / Panel | `panel`, `event`, `metric`, `interactive`; no nested card stacks |
| Tabs | Radix tabs; keyboard arrows; URL state where useful (schedule day, settings sections) |
| Dialog | Radix dialog; title/description; focus trap; Escape; return focus; mobile full-height sheet for long forms |
| Sheet / Drawer | Mobile nav and filters; focus management; safe-area padding |
| Table | Semantic table, caption, sortable headers, row actions, responsive record cards |
| Timeline | Route line + waypoints; current/next states; notes |
| Stepper | Participant trail; event lifecycle; horizontal desktop, compact mobile |
| Avatar | Image or initials; consistent color from user id; no fake photos |
| Progress | Team-size meter, room occupancy, registration capacity; text value always shown |
| EmptyState | Icon/line motif, honest explanation, one next action |
| Alert | Info/success/warning/danger; inline and page-level |
| Toast | Non-blocking confirmation; 5s minimum; not the only error channel |
| Breadcrumb | Coordinator drill-down; current page not a link; mobile truncation with menu |
| CopyButton | Statement vs AI context; clipboard success/failure; aria-live |
| SearchField | Debounced, clear button, scoped-result explanation, loading/empty |
| ConfirmDialog | Destructive/role/assignment changes; shows consequence |

### Domain compositions

- `EventCard` — poster/typographic mark, date ribbon, status, roles.
- `RoleCard` — distinct icon/description/scope; authorized vs locked state.
- `ParticipantTrail` — registration → team → check-in.
- `NextUpCard` — schedule item, time, location, “now/next”.
- `TeamRoster` — leader/member rows, size meter, invitations.
- `InviteDialog` — email, validation, pending state, privacy note.
- `RoomTile` — room, volunteer, teams, occupancy, exception marker.
- `VerificationResult` — identity, team, school, registration/check-in status, confirm action.
- `CheckInOutcome` — verified/duplicate/flagged with timestamp and next action.
- `RoomStatusControl` — status + note; audit explanation.
- `LifecycleStepper` — event status with allowed next actions.
- `AssignmentPicker` — team/volunteer/coordinator selection with capacity/scope.
- `ScheduleEditorRow` — date/time/title/location/kind/reorder/publish.
- `MetricStrip` — real counts, time window, no decorative chart.
- `ExceptionList` — unassigned room, incomplete team, flagged check-in.

### Component rules

- Every interactive element has default, hover, focus-visible, active, disabled, loading, success/error where relevant.
- Buttons use verb-specific labels (“Record check-in”, “Send invitation”), not “OK”.
- Dialog actions are ordered secondary → primary; destructive action separated.
- No icon-only action without an accessible name.
- No whole-card link with nested buttons.

---

## 7. Navigation

### Desktop (≥1024px)

- 264px left sidebar, white/paper surface, fine right border.
- Top: Gatik Events wordmark + current event chip.
- Event switcher + role switcher in the top bar.
- Nav groups with small overline labels; active item uses lavender wash, navy text, and a 3px orange/violet left marker (role-dependent).
- Footer: profile menu, help/privacy, sign out.
- Principal/coordinator dense views use the same shell but wider content; no separate “admin theme”.

### Mobile (<768px)

- **Participant:** bottom nav with 5 items: Overview, Team, Challenge, Schedule, Profile. Team invitations are a badge on Team.
- **Volunteer:** bottom nav: Overview, My Room, Verify, Schedule, More; “More” sheet contains Teams and Profile. Verify is the emphasized center action.
- **Coordinator:** top app bar + menu sheet grouped by Operate (Overview, Rooms, Teams, Schools, Volunteers), Event (Schedule), Account (Profile). Bottom nav would be dishonest with this many items.
- **Principal:** top app bar + full-height nav sheet grouped by Event, People, Operations, Governance, Account. Persistent “current event” chip; role/event switcher.
- Safe-area insets; bottom nav never covers primary content; sticky action bar sits above it.
- Touch targets ≥44px; active state includes text/icon, not just color.

### Role/event switching

- A compact “chip” opens a sheet/menu listing authorized events and roles; unauthorized options never appear.
- Switching is navigation; the server re-validates. If access was revoked, show a safe explanation.

---

## 8. Screen inventory

### Public/auth

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Landing `/` | Split editorial panel + auth card; route motif | Sign in / create account | Auth-first single column; compact brand |
| Signup | Form with name/email/password/confirm | Create account | Full-width fields, inline errors |
| Verify email | Calm status page + resend | Open email / resend | Single column |
| Login | Form + forgot password | Sign in | Full-width |
| Forgot/reset | Single form + success state | Send reset / update password | Full-width |
| Invitation `/invitations/[token]` | Context card: team, event, inviter | Accept / decline | Single column; no-referrer |

### Event entry

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Event directory `/events` | Search + filter chips; event cards with date ribbon | Open event | One card per row; filters in sheet |
| Event introduction | Lavender hero + “Your access” panel + schedule preview | Enter event / register | Hero stacks; access panel first |
| Role selection | Four distinct role cards; locked/unavailable states | Enter authorized role | Stacked cards, clear scope text |

### Participant

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Overview | Trail stepper + next-up + team snapshot + announcements | Continue next step | Single column; next-up first |
| Register | Grouped form (identity, school, student details) | Complete registration | Full-width; sticky submit above bottom nav |
| My Team | Team header + roster + size meter + invitations | Invite teammate / create team | Roster first; invite sheet |
| Problem Statement | Editorial reading column + sticky section nav + copy bar | Copy AI context | Sticky bottom copy bar; TOC in sheet |
| Schedule | Day tabs + vertical timeline + notes | (read) | Single timeline; day tabs sticky |
| Profile | Sections + verification status | Save changes | Full-width |

### Volunteer

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Overview | Room hero + verification CTA + pending/flagged queue | Verify participant | Big search CTA; queue below |
| My Room | Room status + team cards + roster | Update status / view team | Stacked; status sheet |
| Teams | Room-scoped team list | Open team | Record list |
| Verify | Search-first with result cards + confirmation dialog | Record check-in | Full-screen flow; large targets |
| Schedule | Same timeline component | (read) | Same |
| Profile | Shared profile | Save | Same |

### Coordinator

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Overview | Metric strip + 2×3 room board + exception list | Open room | Room cards stacked; exceptions first |
| Rooms | Room tiles/table with occupancy and volunteer | Drill into room | Stacked room cards |
| Room detail | Breadcrumb + teams + roster + status | Open team | Stacked sections |
| Teams | Filterable table/list | Open team | Record cards |
| Team detail | Roster, school, room, check-in | View school/participants | Sections |
| Schools | Aggregated participation table | Drill into school | Stacked cards |
| Volunteers | Assignment/activity table | View room | Record list |
| Schedule/Profile | Shared | — | — |

### Principal

| Screen | Layout | Primary action | Mobile treatment |
|---|---|---|---|
| Overview | Lifecycle stepper + health metrics + exceptions | Advance/configure event | Stepper compact; exceptions first |
| Events | Event list + create/edit | Create event | Stacked cards; form wizard |
| Event editor | Sectioned form (basics, dates, rules, publish) | Save / publish | Step sections; sticky save |
| Participants | Searchable table + filters | View participant | Record cards |
| Schools | Table + add/edit | Add school | Stacked |
| Teams | Table + room assignment | Assign room | Record cards + sheet |
| Rooms | Room table + team/volunteer assignment | Add/edit room | Stacked |
| Volunteers | Staff table + assignment | Assign room | Stacked |
| Coordinators | Staff table + scope | Assign rooms | Stacked |
| Schedule | Day tabs + editable timeline | Add/publish item | Editor sheet |
| Settings | Sectioned settings + lifecycle + announcements + audit tabs | Save/transition | Section list |
| Profile | Shared | Save | Same |

---

## 9. Key screen compositions (not generic card grids)

### Participant overview: “Your trail”

A left-aligned trail (Account → Registered → Team → Check-in) with the current waypoint in violet; the next schedule item is a large navy-edged “Next up” panel; team snapshot is a horizontal roster with a size meter; announcements are a compact list, not a grid of cards.

### Volunteer overview: “Field desk”

The assigned room is the hero (room code, status, occupancy); a large search field is the primary action; the pending/flagged queue is a two-column list on desktop and a stacked list on mobile; recent check-ins are a compact timeline.

### Coordinator overview: “Operations board”

Six room tiles in a 2×3 grid, each showing teams/occupancy/volunteer/exception; a single metric strip above; an exception list to the side. No decorative pie chart. The board is the navigation.

### Principal overview: “Event command center”

Lifecycle stepper across the top; health metrics in a single strip (registrations, confirmed, teams, room utilization, staff coverage); event switcher; exceptions. Configuration actions are grouped in a “Manage” rail, not scattered as equal-weight cards.

### Challenge: editorial reading

Instrument Serif title, generous margins, a numbered section list, sticky “On this page” nav on desktop, and a sticky copy bar on mobile. Copy buttons are distinct: violet primary for AI context, outline for full statement.

### Schedule: waypoint timeline

A single continuous route line; time column on desktop, time-above-title on mobile; current/next items highlighted with a navy/violet marker; logistics notes visually separated without fake times.

### Verification: confirmation-first

Search results are compact rows; selecting a result opens a confirmation panel with identity, team, school, registration, and check-in state. The primary action is disabled until a result is selected; the outcome is explicit and scoped.

---

## 10. Forms

- Persistent labels; placeholders are examples only.
- Group related fields with a short section heading and explanation.
- Required vs optional visible; do not mark every field with an asterisk without a legend.
- Native input types (`tel`, `email`, `date`, `time`) and autocomplete hints.
- Validate on blur/submit; server errors mapped to fields; form values preserved.
- Error summary at top with links to fields; inline error text with icon, not red border alone.
- Submit button shows pending state and prevents double submit; success redirects or shows a clear next step.
- Long forms (event editor, registration) use sections/steps on mobile, not a cramped two-column grid.
- Destructive/role/assignment forms require confirmation and show the affected scope.

---

## 11. Dialogs, sheets, and menus

- Use a dialog for a focused decision (invite, assign room, confirm check-in, role change); not for entire pages.
- Radix focus trap; title/description announced; Escape closes; focus returns to trigger.
- Mobile long dialogs become full-height sheets with sticky actions and safe-area padding.
- Destructive actions use a distinct danger button and explain consequences (“This revokes the coordinator’s access immediately”).
- Do not stack dialogs more than one level; use a page/section for complex editing.
- Popovers/menus are click/keyboard/touch operable; no hover-only controls.
- Toasts are supplementary; critical errors remain inline.

---

## 12. Loading, empty, error, and permission states

| State | Design |
|---|---|
| Loading | Layout-matched skeleton for lists/cards; compact spinner inside buttons; reserve dimensions |
| Empty | Honest message + one relevant action; no fake rows or decorative charts |
| Error | What happened, what to do, retry; correlation id for unexpected errors; preserve input |
| Permission denied | Explain the required access/role and return path; never expose other-event data |
| Offline | Banner: read-only/limited; operational actions disabled; retry |
| Pending | Button spinner, disabled duplicate action, status text |
| Success | Inline confirmation + next step; toast for lightweight actions |
| Conflict | Specific message (already checked in, team full, invitation expired) and safe next action |
| Unpublished content | “Challenge not published yet” / “Schedule not published” instead of placeholder content |

---

## 13. Motion

Motion is functional, short, and interruptible.

| Interaction | Motion | Duration/easing |
|---|---|---|
| Button press | 1px translate / color | 100–140 ms ease-out |
| Hover/focus | border/background/focus ring | 120–180 ms |
| Dialog/sheet | fade + 8px rise/scale 0.98→1 | 180–240 ms enter; 140–180 ms exit |
| Page content | 6–8px fade/rise | 180–220 ms |
| Timeline “now” | one-time highlight/fade; no loop | 240 ms |
| Copy success | icon/text swap + toast | 160 ms |
| Sidebar active marker | translate/opacity | 160 ms |
| List stagger | first-level cards only, 30ms; max 6 | 200–260 ms |
| Route transition | no full-screen block; optional subtle content fade | 180 ms |

- Honor `prefers-reduced-motion: reduce`: remove transforms/staggers, keep instant state changes and essential feedback.
- No parallax, scroll hijacking, continuous gradient animation, or looping decorative motion.
- Animate transform/opacity, not layout-heavy properties.
- Do not delay navigation or block reading for animation.

---

## 14. Accessibility

Target: **WCAG 2.2 AA**, verified with actual checks.

- Semantic landmarks, one `h1` per page, logical heading order.
- Skip link to main content.
- Keyboard: all controls, menus, tabs, dialogs, tables; no traps except a proper modal; visible focus.
- Focus ring: 2–3px, high contrast, offset; never removed.
- Inputs: labels, help/error association (`aria-describedby`), required state, autocomplete.
- Errors: summary + inline; not color alone; preserve values.
- Status: text + icon; live regions for copy success and check-in outcome.
- Target size: ≥24px WCAG minimum, ≥44px preferred for touch; primary mobile actions 48px.
- Contrast: measured tokens; retest rendered surfaces.
- Zoom/reflow: 200% and narrow widths; no clipped actions or two-dimensional scrolling except data tables with an alternative.
- Motion: reduced-motion support; no flashing.
- Images: meaningful alt for event posters; decorative route motif `aria-hidden`.
- Tables: caption, scope headers, sortable state announced.
- PWA: install is optional; no task depends on installation.
- Testing: axe/Lighthouse + keyboard + manual names/focus/errors + screen-reader spot check where available. Automated checks are not sufficient; do not claim full conformance.

---

## 15. Responsive behavior matrix

| Width | Navigation | Content behavior |
|---:|---|---|
| 360 | Bottom nav (P/V), top bar + sheet (C/Pr); 16px padding | Single column; stacked records; full-width dialogs/sheets |
| 390 | Same | Same; verify search full-screen flow |
| 430 | Same | Same; two-column metric chips if legible |
| 768 | Top bar + drawer; optional bottom nav for P/V | Two-column cards; timeline time column appears |
| 1024 | Persistent sidebar; 240–264px | Dashboard grids 2–3 columns; tables with scroll affordance |
| 1280 | Sidebar + max 1280 content | Room board 3×2; reading column centered |
| 1440 | Same | Avoid stretching; whitespace intentional; max widths hold |

- Test actual component thresholds, not only named devices.
- No horizontal overflow at 360px; long names/emails/team names wrap or truncate with accessible full text.
- Sticky headers/bottom bars account for safe areas and on-screen keyboards.
- Tables get a deliberate mobile treatment (record cards or scroll with visible affordance), not accidental clipping.

---

## 16. Content design

- Use domain language: “Room”, “Team”, “Check-in”, “Coordinator”, “Principal”, “Challenge”, “Schedule”.
- Buttons say what happens: “Send invitation”, “Record check-in”, “Assign to Room 3”, “Publish schedule”.
- Empty states explain scope and next action: “No participants in this room match ‘Aarav’. Only participants assigned to Room 3 are searchable.”
- Do not claim security, speed, or impact that has not been verified.
- Synthetic demo data is labeled as synthetic in the judge guide, not in the UI.
- Dates/times use `Asia/Kolkata` and explicit timezone labels where ambiguity could occur.
- Avoid jargon like “resources”, “entities”, “records” in user-facing copy.

---

## 17. Asset plan and current gaps

**Available:** official Xplorer schedule PDF (outside the project, visually verified), product brief, color direction.

**Missing:** Gatik logo files, Xplorer logo/poster artwork, favicon/PWA icons, photography, font licenses (Google Fonts are open; confirm institutional usage), and the full problem statement.

**Interim approach:** use a typographic event mark (“XPLORER 26 / CHAPTER 4”) with the route motif and token colors; do not imitate the dark poster. Once assets arrive, use them with a light scrim and preserve text contrast. Do not copy protected artwork without permission.

**PWA icons:** derive from the approved logo/mark; provide 192, 512, maskable, Apple touch icon. No placeholder icon shipped to production without review.

---

## 18. Visual QA protocol (to run after implementation)

1. Run the app; verify the route and real content.
2. Capture screenshots at 360, 390, 430, 768, 1024, 1280, 1440.
3. Check hierarchy, typography, spacing, contrast, overflow, and sticky behavior.
4. Exercise participant, volunteer, coordinator, and principal primary journeys.
5. Check loading, empty, error, success, disabled, permission-denied, offline.
6. Keyboard traversal and focus visibility; dialog focus trap/return.
7. Run axe/Lighthouse; record actual results.
8. Test reduced motion and zoom/reflow.
9. Prioritize P0–P3 defects; fix highest impact first; re-run.
10. Report what was actually checked; do not claim unperformed tests.

**Acceptance:** no P0/P1 visual/accessibility defects on primary flows; no horizontal overflow at required widths; all primary actions have working states; consistent tokens/components; honest empty/error content.

---

## 19. Design decisions and open items

**Decisions**

- Light-only MVP; no dark theme until a separately designed semantic theme exists.
- Manrope + Instrument Serif; no third font.
- Navy/orange institutional identity; violet/lavender/lime event identity in controlled doses.
- shadcn/ui + Radix + Lucide; no second component library.
- Route/waypoint motif as the signature element.
- Mobile bottom nav for participant/volunteer; drawer for coordinator/principal.
- CSS-only motion; no animation library.

**Open items**

- Final logo/poster assets and usage rights.
- Whether the institution wants a denser “table-first” coordinator view or the room-board-first view (current plan: board-first).
- Whether to show participant photos/avatars (current plan: initials, optional avatar).
- Final team removal/leadership policy affects copy/dialogs.
- Whether a demo staff access gate is required (recommendation: no; see [SECURITY_PLAN.md](SECURITY_PLAN.md)).
- Final problem-statement content affects reading layout length and copy formatting.
