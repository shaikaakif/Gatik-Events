-- Gatik Events: core schema
-- Milestone M0/M1 foundation. All timestamps are timezone-aware.
-- Role authority is event_memberships only. Sensitive writes are RPC-only.

create extension if not exists pgcrypto with schema extensions;

create type public.event_status as enum (
  'draft', 'published', 'registration_open', 'registration_closed',
  'in_progress', 'completed', 'archived'
);
create type public.event_role as enum ('participant', 'volunteer', 'coordinator', 'principal');
create type public.membership_status as enum ('active', 'suspended', 'revoked');
create type public.registration_status as enum ('pending', 'confirmed', 'waitlisted', 'cancelled');
create type public.team_status as enum ('forming', 'complete', 'locked', 'withdrawn', 'disqualified');
create type public.team_member_role as enum ('leader', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'revoked', 'expired');
create type public.room_status as enum ('setup', 'active', 'full', 'closed', 'issue');
create type public.check_in_status as enum ('verified', 'unregistered', 'ambiguous', 'duplicate', 'flagged');
create type public.schedule_kind as enum ('activity', 'break', 'ceremony', 'logistics', 'note');
create type public.announcement_audience as enum ('all', 'participants', 'volunteers', 'coordinators', 'principals');
create type public.school_event_status as enum ('invited', 'registered', 'confirmed', 'withdrawn');
create type public.assignment_status as enum ('active', 'inactive');
create type public.account_status as enum ('active', 'suspended', 'disabled');

-- Custom application identity. Supabase Auth is intentionally not used.
create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    email = lower(trim(email)) and char_length(email) between 3 and 254
  ),
  password_hash text not null,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text check (phone is null or char_length(phone) between 5 and 24),
  email_verified_at timestamptz,
  status public.account_status not null default 'active',
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index auth_sessions_user_active_idx on public.auth_sessions (user_id, expires_at)
where revoked_at is null;

create table public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_verification_tokens_active_idx
on public.email_verification_tokens (user_id, expires_at) where consumed_at is null;

create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index password_reset_tokens_active_idx
on public.password_reset_tokens (user_id, expires_at) where consumed_at is null;

create table public.auth_rate_limits (
  id bigint generated always as identity primary key,
  scope text not null,
  key_hash text not null,
  attempted_at timestamptz not null default now()
);
create index auth_rate_limits_lookup_idx on public.auth_rate_limits (scope, key_hash, attempted_at desc);

create table public.auth_audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  result text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index auth_audit_logs_user_time_idx on public.auth_audit_logs (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  full_name text not null default 'New participant'
    check (char_length(trim(full_name)) between 2 and 120),
  phone text check (phone is null or char_length(phone) between 5 and 24),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  city text,
  state text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index schools_name_city_key on public.schools (lower(name), lower(coalesce(city, '')));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 3 and 160),
  category text not null default 'other'
    check (category in ('hackathon', 'annual_day', 'sports', 'exhibition', 'cultural', 'workshop', 'competition', 'club', 'other')),
  description text,
  poster_url text,
  venue_name text not null check (char_length(trim(venue_name)) between 2 and 200),
  venue_address text,
  timezone text not null default 'Asia/Kolkata',
  starts_on date not null,
  ends_on date not null,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  status public.event_status not null default 'draft',
  min_team_size smallint not null default 2 check (min_team_size between 1 and 20),
  max_team_size smallint not null default 5 check (max_team_size between min_team_size and 50),
  max_teams integer check (max_teams is null or max_teams > 0),
  capacity integer check (capacity is null or capacity > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_order check (ends_on >= starts_on),
  constraint events_registration_order check (
    registration_opens_at is null or registration_closes_at is null
    or registration_closes_at > registration_opens_at
  ),
  constraint events_capacity_team_order check (
    capacity is null or max_team_size is null or capacity >= max_team_size
  )
);
create index events_status_dates_idx on public.events (status, starts_on);
create index events_dates_idx on public.events (starts_on, ends_on);

create table public.event_schools (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  status public.school_event_status not null default 'registered',
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, school_id)
);
create index event_schools_event_status_idx on public.event_schools (event_id, status);

create table public.event_memberships (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.event_role not null,
  status public.membership_status not null default 'active',
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  notes text,
  unique (event_id, user_id, role)
);
create index event_memberships_event_role_status_idx on public.event_memberships (event_id, role, status);
create index event_memberships_user_status_idx on public.event_memberships (user_id, status);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null,
  status public.registration_status not null default 'confirmed',
  grade_year text not null check (char_length(trim(grade_year)) between 1 and 40),
  roll_number text check (roll_number is null or char_length(roll_number) <= 40),
  responses jsonb not null default '{}'::jsonb check (jsonb_typeof(responses) = 'object'),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id),
  unique (id, event_id),
  constraint event_registrations_school_fk
    foreign key (event_id, school_id) references public.event_schools(event_id, school_id) on delete restrict
);
create index event_registrations_event_status_idx on public.event_registrations (event_id, status);
create index event_registrations_event_school_idx on public.event_registrations (event_id, school_id);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  school_id uuid not null,
  name text not null check (char_length(trim(name)) between 2 and 60),
  code text not null check (char_length(code) between 2 and 20),
  description text check (description is null or char_length(description) <= 500),
  leader_user_id uuid not null references public.profiles(id) on delete restrict,
  status public.team_status not null default 'forming',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, event_id),
  unique (event_id, code),
  constraint teams_school_fk
    foreign key (event_id, school_id) references public.event_schools(event_id, school_id) on delete restrict
);
create unique index teams_name_event_key on public.teams (event_id, lower(name));
create index teams_event_status_idx on public.teams (event_id, status);
create index teams_event_school_idx on public.teams (event_id, school_id);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  role public.team_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (event_id, user_id),
  constraint team_members_team_event_fk
    foreign key (team_id, event_id) references public.teams(id, event_id) on delete cascade
);
create index team_members_user_idx on public.team_members (user_id);
create index team_members_event_team_idx on public.team_members (event_id, team_id);

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text not null,
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint team_invitations_team_event_fk
    foreign key (team_id, event_id) references public.teams(id, event_id) on delete cascade
);
create unique index team_invitations_pending_key
  on public.team_invitations (team_id, invited_user_id) where status = 'pending';
create index team_invitations_invitee_idx on public.team_invitations (invited_user_id, status);
create index team_invitations_event_team_idx on public.team_invitations (event_id, team_id, status);
create index team_invitations_expiry_idx on public.team_invitations (expires_at) where status = 'pending';

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  code text not null check (char_length(code) between 1 and 20),
  location text,
  team_capacity smallint not null default 2 check (team_capacity >= 1),
  status public.room_status not null default 'setup',
  status_note text check (status_note is null or char_length(status_note) <= 300),
  status_updated_by uuid references public.profiles(id) on delete set null,
  status_updated_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, event_id),
  unique (event_id, code)
);
create index rooms_event_order_idx on public.rooms (event_id, sort_order);

create table public.room_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_id uuid not null,
  team_id uuid not null,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unique (team_id),
  unique (room_id, team_id),
  constraint room_assignments_room_event_fk
    foreign key (room_id, event_id) references public.rooms(id, event_id) on delete cascade,
  constraint room_assignments_team_event_fk
    foreign key (team_id, event_id) references public.teams(id, event_id) on delete cascade
);
create index room_assignments_event_room_idx on public.room_assignments (event_id, room_id);

create table public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.assignment_status not null default 'active',
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unique (room_id, user_id),
  constraint volunteer_assignments_room_event_fk
    foreign key (room_id, event_id) references public.rooms(id, event_id) on delete cascade
);
create unique index volunteer_assignments_one_active_room
  on public.volunteer_assignments (room_id) where status = 'active';
create index volunteer_assignments_user_idx on public.volunteer_assignments (user_id, status);
create index volunteer_assignments_event_room_idx on public.volunteer_assignments (event_id, room_id, status);

create table public.coordinator_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid,
  status public.assignment_status not null default 'active',
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  constraint coordinator_assignments_room_event_fk
    foreign key (room_id, event_id) references public.rooms(id, event_id) on delete cascade
);
create unique index coordinator_assignments_all_rooms_active
  on public.coordinator_assignments (event_id, user_id)
  where room_id is null and status = 'active';
create unique index coordinator_assignments_room_active
  on public.coordinator_assignments (event_id, user_id, room_id)
  where room_id is not null and status = 'active';
create index coordinator_assignments_event_user_idx on public.coordinator_assignments (event_id, user_id, status);
create index coordinator_assignments_event_room_idx on public.coordinator_assignments (event_id, room_id);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_id uuid not null,
  volunteer_user_id uuid not null references public.profiles(id) on delete restrict,
  participant_user_id uuid references public.profiles(id) on delete set null,
  registration_id uuid,
  team_id uuid,
  status public.check_in_status not null,
  subject_name text check (subject_name is null or char_length(subject_name) <= 120),
  subject_email text check (subject_email is null or char_length(subject_email) <= 254),
  subject_phone text check (subject_phone is null or char_length(subject_phone) <= 24),
  notes text check (notes is null or char_length(notes) <= 500),
  checked_in_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint check_ins_verified_subject check (
    status <> 'verified'
    or (participant_user_id is not null and registration_id is not null and team_id is not null)
  ),
  constraint check_ins_room_event_fk
    foreign key (room_id, event_id) references public.rooms(id, event_id) on delete cascade,
  constraint check_ins_registration_event_fk
    foreign key (registration_id, event_id) references public.event_registrations(id, event_id) on delete restrict,
  constraint check_ins_team_event_fk
    foreign key (team_id, event_id) references public.teams(id, event_id) on delete restrict
);
create unique index check_ins_one_verified
  on public.check_ins (event_id, participant_user_id)
  where status = 'verified' and participant_user_id is not null;
create index check_ins_event_room_time_idx on public.check_ins (event_id, room_id, checked_in_at desc);
create index check_ins_event_status_idx on public.check_ins (event_id, status);
create index check_ins_participant_idx on public.check_ins (participant_user_id);

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  day_date date not null,
  starts_at timestamptz,
  ends_at timestamptz,
  time_label text,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  location text,
  kind public.schedule_kind not null default 'activity',
  sequence integer not null,
  is_published boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, day_date, sequence),
  constraint schedule_times_order check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint schedule_time_presence check (starts_at is not null or time_label is not null)
);
create index schedule_items_event_day_idx on public.schedule_items (event_id, day_date, sequence);

create table public.event_challenges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  summary text,
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  is_published boolean not null default false,
  version integer not null default 1 check (version > 0),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 140),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  audience public.announcement_audience not null default 'all',
  is_pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index event_announcements_event_time_idx on public.event_announcements (event_id, published_at desc);
create index event_announcements_event_audience_idx on public.event_announcements (event_id, audience, is_pinned);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index audit_logs_event_time_idx on public.audit_logs (event_id, created_at desc);
create index audit_logs_actor_time_idx on public.audit_logs (actor_user_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger app_users_set_updated_at before update on public.app_users
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();
create trigger registrations_set_updated_at before update on public.event_registrations
for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams
for each row execute function public.set_updated_at();
create trigger rooms_set_updated_at before update on public.rooms
for each row execute function public.set_updated_at();
create trigger schedule_set_updated_at before update on public.schedule_items
for each row execute function public.set_updated_at();
create trigger challenges_set_updated_at before update on public.event_challenges
for each row execute function public.set_updated_at();

create or replace function public.handle_new_app_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.full_name, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_app_user_created
after insert on public.app_users
for each row execute function public.handle_new_app_user();

create or replace function public.ensure_team_member_consistency()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event_id uuid;
  v_confirmed boolean;
  v_existing_team uuid;
begin
  select event_id into v_event_id from public.teams where id = new.team_id;
  if v_event_id is null or v_event_id <> new.event_id then
    raise exception 'Team and member event do not match.' using errcode = '23514';
  end if;

  select exists (
    select 1 from public.event_registrations
    where event_id = new.event_id and user_id = new.user_id and status = 'confirmed'
  ) into v_confirmed;
  if not v_confirmed then
    raise exception 'Team membership requires a confirmed event registration.' using errcode = '23514';
  end if;

  select team_id into v_existing_team
  from public.team_members
  where event_id = new.event_id and user_id = new.user_id and team_id <> new.team_id
  limit 1;
  if v_existing_team is not null then
    raise exception 'Participant already belongs to a team for this event.' using errcode = '23505';
  end if;

  return new;
end;
$$;

create trigger team_members_consistency
before insert or update on public.team_members
for each row execute function public.ensure_team_member_consistency();

create or replace function public.guard_team_member_delete()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_leader uuid;
  v_count integer;
begin
  select leader_user_id into v_leader from public.teams where id = old.team_id;
  if old.user_id = v_leader then
    select count(*) into v_count from public.team_members where team_id = old.team_id;
    if v_count > 1 then
      raise exception 'Transfer leadership before leaving the team.' using errcode = '23514';
    end if;
  end if;
  return old;
end;
$$;

create trigger team_members_guard_delete
before delete on public.team_members
for each row execute function public.guard_team_member_delete();

create or replace function public.sync_team_status_from_members()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team_id uuid;
  v_event_id uuid;
  v_count integer;
  v_min smallint;
  v_status public.team_status;
begin
  if tg_op = 'DELETE' then
    v_team_id := old.team_id;
    v_event_id := old.event_id;
  else
    v_team_id := new.team_id;
    v_event_id := new.event_id;
  end if;

  select min_team_size into v_min from public.events where id = v_event_id;
  select count(*) into v_count from public.team_members where team_id = v_team_id;
  select status into v_status from public.teams where id = v_team_id;
  if v_status = 'forming' and v_min is not null and v_count >= v_min then
    update public.teams set status = 'complete' where id = v_team_id;
  elsif v_status = 'complete' and v_min is not null and v_count < v_min then
    update public.teams set status = 'forming' where id = v_team_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger team_members_sync_status
after insert or delete on public.team_members
for each row execute function public.sync_team_status_from_members();

create or replace function public.protect_last_principal()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event_id uuid := coalesce(new.event_id, old.event_id);
  v_remaining integer;
begin
  if old.role = 'principal' and old.status = 'active'
     and (tg_op = 'DELETE' or new.status <> 'active' or new.role <> 'principal') then
    select count(*) into v_remaining
    from public.event_memberships
    where event_id = v_event_id and role = 'principal' and status = 'active'
      and id <> old.id;
    if v_remaining = 0 then
      raise exception 'An event must retain at least one active principal.' using errcode = '23514';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger event_memberships_protect_last_principal
before update or delete on public.event_memberships
for each row execute function public.protect_last_principal();
