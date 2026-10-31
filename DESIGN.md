# G Events V2 — Design System (Neo-Brutalist Warm Editorial)

**Product:** G Events  
**Version:** 2.0  
**Status:** In implementation  
**Design identity:** Warm Editorial Neo-Brutalist — a premium, tactile, responsive-first campus SaaS platform.

## 1. Visual direction

One primary visual language: **warm editorial neo-brutalism**. Strong typography, deliberate whitespace, tactile surfaces, purposeful geometry. Emotional but functional. Editorial voice with institutional restraint.

### Non-negotiable preservation
- The owner-confirmed institutional journey, event-scoped authorization, RLS invariants, and exact brand source are preserved.
- Supabase Auth is removed from the application flow; custom server authentication is the current architecture.
- No fake live data, mocked authorization, or unsupported product claims.

## 2. Semantic color tokens (approved palette)

| Role | Token | Value | Usage |
|---|---|---|---|
| Warm paper | `--color-paper` | `#F6F1E8` | Main canvas / page background |
| Deep ink | `--color-ink` | `#24211D` | Text, structural rules, borders |
| Terracotta | `--color-terracotta` | `#B85C46` | Primary brand warmth, nav, key buttons |
| Coral | `--color-coral` | `#E65B45` | Interactive emphasis, hover states |
| Mustard | `--color-mustard` | `#D9A928` | Selected highlights, accent |
| Pale sage | `--color-sage` | `#DDE5D7` | Quiet secondary surfaces, muted panels |

### Legacy aliases (for backward compatibility)
Existing components reference these mapped values:
- `--event-violet` / `--event-lavender` / `--event-lime` retained where they don't conflict
- `--primary` = terracotta, `--primary-accent` = coral
- `--surface-muted`, `--border-strong`, `--focus-ring` retained unchanged

### Color application rules
1. Terracotta is the primary brand colour for navigation, major buttons, headings
2. Coral is the distinctive accent for CTA states, selected indicators
3. Deep ink is the structural colour for outlines, rules, body text
4. Warm paper surfaces should establish the main application environment
5. Mustard provides selective highlight warmth — use sparingly
6. Pale sage provides quiet secondary depth — do not overuse
7. Do not use every colour in every component
8. Maintain appropriate contrast and accessibility per WCAG AA
9. Do not use coral for large areas of small-text content
10. Do not make every dashboard colourful — keep operational interfaces calm, readable and professional

## 3. Typography

Primary display:
- Instrument Serif, already self-hosted via `next/font/local` in `src/app/layout.tsx`
- Newsreader may be evaluated if already available or added responsibly
- Do not download or depend on remote font services at runtime

Body/UI:
- Manrope, already self-hosted (`--font-manrope`)

Metadata:
- IBM Plex Mono or system monospace fallback (`--font-mono`)
- Use sparingly for dates, coordinates, small metadata and technical labels

### Hierarchy roles

| Role | Family | Size | Weight | Use |
|---|---|---|---|---|
| Display / hero | Instrument Serif | clamp(3rem, 6vw, 6rem) | 400–600 | Hero titles, institutional wordmark |
| Page title | Instrument Serif | 2rem–2.5rem | 700 | Section heads |
| Section title | Manrope | 1.25rem–1.5rem | 600–700 | Section headings |
| Body copy | Manrope | 1rem | 400 | Prose, forms, metadata |
| Label / control | Manrope | 0.875rem | 600 | Form labels, eyebrow text |
| Metadata / caption | IBM Plex Mono / system monospace | 0.75rem | 500 | Dates, codes, technical labels |

Line height:
- Display: 1.1–1.2
- Body: 1.5–1.6
- Labels: 1.3–1.4

Max line length: ~45–80 characters for reading.

### Typographic anti-patterns to eliminate

- All headings and body at nearly the same size
- Very light weights for small text
- Excessive all-caps labels or letterspacing
- Huge display headlines without a clear product message
- Center-aligned long paragraphs
- Faint gray body text used for visual minimalism
- Text embedded in images when real text would be clearer

## 4. Spacing and shape

Base 8px increment system. Scale: 0 / 2 / 4 / 6 / 8 / 12 / 16 / 24 / 32 rem.  
Radius: 0 (sharp corners) / 4px / 8px / 12px / 9999px (square).  
Shadow: 
- None / `0 2px 0 #24211D` (hard offset) / `0 4px 8px rgba(36,33,29,0.15)` (subtle)
- Use hard offset shadows in controlled places only
- Avoid heavy shadows

## 5. Component states

Every interactive control: default / focus-visible (strong visible ring) / active / disabled / loading. Never rely on color alone for meaning — pair with icon/text/pattern.

## 6. Motion

Purposeful only. Transform/opacity for entrances, hovers, and dialogs. Respect `prefers-reduced-motion`. Durations: fast 120ms / normal 200ms / slow 320ms. No layout-shift animation, no scroll hijack.

## 7. Responsive breakpoints (test targets)

360 / 390 / 430 / 768 / 1024 / 1440 / 1920 px. Content-driven, not device-named.

## 8. Required shared components

`BrandLogo`, `MainNavigation`, `MobileNavigation`, `PageHeader`, `DashboardShell`, `Sidebar`, `StatCard`, `StatusBadge`, `SearchInput`, `DataTable`, `EmptyState`, `LoadingSkeleton`, `Dialog`, `FormField`, `Toast`, `TicketCard`, `TicketForm`, `TicketStatus`, `TicketNotification`.

## 9. Screens to redesign

1. Public institutional landing page (Screen 01)
2. G Events directory (Screen 02)
3. Event overview + role selection (Screens 03–04)
4. All four role dashboards remain functional (Screen 05)

## 10. Milestone status

| Milestone | Status |
|---|---|
| 1. Audit and design | Complete |
| 2. Design system | Complete |
| 3. Public and entry journey | In progress |
| 4. Dashboards and support | Not started |
| 5. QA and refinement | Not started |
