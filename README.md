# Gatik Events

Gatik Events is the mobile-first campus event operations platform for G Group of Institutions. The current clean build implements the institutional entry, database-driven event journey, four event-scoped workspaces, custom authentication architecture, and a privacy-safe PWA shell.

> Read `GATIK_EVENTS_MASTER_PROJECT.md` and `docs/IMPLEMENTATION_STATUS.md` before changing code. Older planning files are historical where they conflict with the master blueprint.

## Requirements

- Node.js 22 or newer
- pnpm 10.18.1
- Supabase CLI for database workflows
- A clean development Supabase project
- A verified Resend sender for authentication email

## Local setup

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm icons:generate
pnpm dev
```

Configure `.env.local` privately. Never commit or paste secrets into issues/chat. Validate names without printing values:

```powershell
pnpm env:verify
```

## Custom JWT setup

The app does **not** use Supabase Auth. It uses an imported ES256 signing key so short-lived application JWTs can enter PostgREST as `authenticated` and make `auth.uid()` equal the custom account UUID.

1. Generate a signing key privately: `supabase gen signing-key --algorithm ES256`.
2. Store the private JWK JSON as `AUTH_JWT_PRIVATE_KEY` and its `kid` as `AUTH_JWT_KEY_ID` in local/Vercel server-only environment variables.
3. In the chosen development Supabase project, import the matching key as a standby JWT signing key.
4. Wait for key propagation, then rotate it into use only after owner approval.
5. Apply migrations to the clean development project and execute the RLS tests before using real accounts.

Do not put the private JWK in Git. Do not rotate any existing production key as part of setup.

## Database

Apply only to a reviewed development project:

```powershell
supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
supabase db push --dry-run
supabase db push
supabase db lint
```

`supabase/seed/seed.sql` contains disabled synthetic `.invalid` accounts and deterministic operational fixtures. It does not contain sign-in credentials or official challenge content.

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Brand icon generation

The exact approved source is `public/icons/gatik.jpg`:

```powershell
pnpm icons:generate
```

The script creates 16/32/48 favicons, Apple 180, PWA 192/512, a padded maskable 512, and ICO output without replacing the source.

## GitHub initialization and push

The workspace may not yet be a Git repository. Review `.env.local` exclusion before running:

```powershell
git init
git branch -M rebuild/main
git remote add origin https://github.com/shaikaakif/Gatik-Events.git
git add .
git status
git commit -m "feat: clean rebuild Gatik Events foundation"
git push -u origin rebuild/main
```

If `origin` already exists, use `git remote set-url origin https://github.com/shaikaakif/Gatik-Events.git`. Open a pull request; do not force-push or overwrite the production branch.

## Vercel preview deployment

Install/login privately, then link to a **preview** project/environment:

```powershell
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link
pnpm dlx vercel@latest env pull .env.vercel.local
pnpm dlx vercel@latest
```

After preview QA and owner approval only:

```powershell
pnpm dlx vercel@latest --prod
```

Do not attach `g-events.shaikaakif.com`, alter DNS, or migrate production data until the release checklist is approved.
