-- Idempotent seed data for Gatik Events — Xplorer 2026 (Chapter 4).
-- Run against a fresh Supabase project after migrations are applied.
-- Requires postgres-level migration/seed access. Accounts are disabled synthetic fixtures.
--
-- Creates:
--   6 synthetic schools
--   1 event: Xplorer 2026 (Oct 31 – Nov 1, 2026, Asia/Kolkata)
--   6 rooms (team_capacity 2 each), 12 teams (2 per room), 2–5 members per team
--   6 volunteers (1 per room), 2 coordinators, 1 principal
--   22 verified schedule items (times preserved; missing times/locations null)
--
-- Demo accounts use deterministic UUIDs and .invalid addresses. They cannot sign in.

-- 1. Clean previous seed data (reverse dependency order).
delete from public.check_ins where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.room_assignments where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.volunteer_assignments where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.coordinator_assignments where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.team_members where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.team_invitations where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.teams where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.event_registrations where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.event_memberships where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.event_schools where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.schedule_items where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.rooms where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.event_challenges where event_id in (
  select id from public.events where slug = 'xplorer-2026-chapter-4'
);
delete from public.events where slug = 'xplorer-2026-chapter-4';
delete from public.schools where name in (
  'Springfield Public School',
  'Maple Ridge Academy',
  'Blue Nile International',
  'Oakwood Senior Secondary',
  'Cedar Valley School',
  'Pinecrest High School'
);

-- 2. Disabled synthetic staff accounts (no credentials are committed).
insert into public.app_users (id, email, password_hash, full_name, phone, email_verified_at, status)
values
  ('11111111-1111-1111-1111-111111111101', 'principal@xplorer26.invalid', 'disabled-seed-account', 'Demo Principal', '+91 90000 00001', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111102', 'coordinator.all@xplorer26.invalid', 'disabled-seed-account', 'All-Room Coordinator', '+91 90000 00002', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111103', 'coordinator.room@xplorer26.invalid', 'disabled-seed-account', 'Room-Scoped Coordinator', '+91 90000 00003', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111104', 'volunteer.r01@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 01', '+91 90000 00004', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111105', 'volunteer.r02@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 02', '+91 90000 00005', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111106', 'volunteer.r03@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 03', '+91 90000 00006', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111107', 'volunteer.r04@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 04', '+91 90000 00007', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111108', 'volunteer.r05@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 05', '+91 90000 00008', now(), 'disabled'),
  ('11111111-1111-1111-1111-111111111109', 'volunteer.r06@xplorer26.invalid', 'disabled-seed-account', 'Volunteer Room 06', '+91 90000 00009', now(), 'disabled')
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  status = excluded.status,
  updated_at = now();

-- 3. Profiles for staff demo accounts.
insert into public.profiles (id, full_name, phone, avatar_url)
values
  ('11111111-1111-1111-1111-111111111101', 'Demo Principal', '+91 90000 00001', null),
  ('11111111-1111-1111-1111-111111111102', 'All-Room Coordinator', '+91 90000 00002', null),
  ('11111111-1111-1111-1111-111111111103', 'Room-Scoped Coordinator', '+91 90000 00003', null),
  ('11111111-1111-1111-1111-111111111104', 'Volunteer Room 01', '+91 90000 00004', null),
  ('11111111-1111-1111-1111-111111111105', 'Volunteer Room 02', '+91 90000 00005', null),
  ('11111111-1111-1111-1111-111111111106', 'Volunteer Room 03', '+91 90000 00006', null),
  ('11111111-1111-1111-1111-111111111107', 'Volunteer Room 04', '+91 90000 00007', null),
  ('11111111-1111-1111-1111-111111111108', 'Volunteer Room 05', '+91 90000 00008', null),
  ('11111111-1111-1111-1111-111111111109', 'Volunteer Room 06', '+91 90000 00009', null)
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone;

-- Synthetic participants used only to exercise team/room relationships.
insert into public.app_users (id, email, password_hash, full_name, email_verified_at, status)
select
  ('22222222-2222-2222-2222-' || lpad(i::text, 12, '0'))::uuid,
  'participant' || lpad(i::text, 3, '0') || '@xplorer26.invalid',
  'disabled-seed-account',
  'Synthetic Participant ' || lpad(i::text, 2, '0'),
  now(),
  'disabled'
from generate_series(1, 60) as i
on conflict (id) do update set
  full_name = excluded.full_name,
  status = excluded.status,
  updated_at = now();

-- 4. Synthetic schools (no real minors' data).
insert into public.schools (id, name, city, state, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Springfield Public School', 'Bengaluru', 'Karnataka', '11111111-1111-1111-1111-111111111101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Maple Ridge Academy', 'Pune', 'Maharashtra', '11111111-1111-1111-1111-111111111101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', 'Blue Nile International', 'Chennai', 'Tamil Nadu', '11111111-1111-1111-1111-111111111101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', 'Oakwood Senior Secondary', 'Hyderabad', 'Telangana', '11111111-1111-1111-1111-111111111101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005', 'Cedar Valley School', 'Jaipur', 'Rajasthan', '11111111-1111-1111-1111-111111111101'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006', 'Pinecrest High School', 'Lucknow', 'Uttar Pradesh', '11111111-1111-1111-1111-111111111101')
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  state = excluded.state;

-- 5. Event: Xplorer 2026 — Chapter 4 (registration_open per documented demo-only state).
insert into public.events (
  id, slug, title, category, description, venue_name, venue_address, timezone,
  starts_on, ends_on, registration_opens_at, registration_closes_at,
  min_team_size, max_team_size, max_teams, capacity, created_by, status
)
values (
  gen_random_uuid(),
  'xplorer-2026-chapter-4',
  'Xplorer 2026 — Chapter 4',
  'hackathon',
  'A team-based campus event coordinated through Gatik Events.',
  'Gatik Junior College, The Bodhi Tree Campus',
  'Bhanur, Telangana, India',
  'Asia/Kolkata',
  '2026-10-31',
  '2026-11-01',
  '2026-10-01 09:00:00+05:30',
  '2026-10-30 23:59:00+05:30',
  2, 5, 12, 60, '11111111-1111-1111-1111-111111111101', 'registration_open'
)
on conflict (slug) do update set
  title = excluded.title,
  status = excluded.status,
  updated_at = now();

-- 6. Event schools (all 6 registered/confirmed).
insert into public.event_schools (event_id, school_id, status, registered_at)
select e.id, s.id, 'registered', now()
from public.events e
cross join public.schools s
where e.slug = 'xplorer-2026-chapter-4'
  and s.name in (
    'Springfield Public School', 'Maple Ridge Academy', 'Blue Nile International',
    'Oakwood Senior Secondary', 'Cedar Valley School', 'Pinecrest High School'
  )
on conflict (event_id, school_id) do update set
  status = 'registered',
  registered_at = coalesce(public.event_schools.registered_at, now());

-- 7. Event memberships for demo staff.
insert into public.event_memberships (event_id, user_id, role, status, granted_by)
select e.id, u.id, u.role, 'active', '11111111-1111-1111-1111-111111111101'
from public.events e
cross join (
  values
    ('11111111-1111-1111-1111-111111111101', 'principal'),
    ('11111111-1111-1111-1111-111111111102', 'coordinator'),
    ('11111111-1111-1111-1111-111111111103', 'coordinator'),
    ('11111111-1111-1111-1111-111111111104', 'volunteer'),
    ('11111111-1111-1111-1111-111111111105', 'volunteer'),
    ('11111111-1111-1111-1111-111111111106', 'volunteer'),
    ('11111111-1111-1111-1111-111111111107', 'volunteer'),
    ('11111111-1111-1111-1111-111111111108', 'volunteer'),
    ('11111111-1111-1111-1111-111111111109', 'volunteer')
) as u(id, role)
where e.slug = 'xplorer-2026-chapter-4'
on conflict (event_id, user_id, role) do update set
  status = 'active',
  granted_at = now();

-- 8. Rooms (6 rooms, capacity 2 teams each).
insert into public.rooms (event_id, name, code, location, team_capacity, status, sort_order, created_by)
select e.id, r.name, r.code, r.location, r.team_capacity, r.status, r.sort_order, '11111111-1111-1111-1111-111111111101'
from public.events e
cross join (
  values
    ('Workshop Hall A', 'R01', 'Ground Floor — West Wing', 2, 'active', 1),
    ('Workshop Hall B', 'R02', 'Ground Floor — East Wing', 2, 'active', 2),
    ('Workshop Hall C', 'R03', 'First Floor — North Wing', 2, 'active', 3),
    ('Workshop Hall D', 'R04', 'First Floor — South Wing', 2, 'active', 4),
    ('Workshop Hall E', 'R05', 'Second Floor — West Wing', 2, 'active', 5),
    ('Workshop Hall F', 'R06', 'Second Floor — East Wing', 2, 'active', 6)
) as r(name, code, location, team_capacity, status, sort_order)
where e.slug = 'xplorer-2026-chapter-4'
on conflict (id) do nothing;

-- 9. Volunteer assignments (1 volunteer per room).
insert into public.volunteer_assignments (event_id, room_id, user_id, status, assigned_by)
select e.id, r.id, v.id, 'active', '11111111-1111-1111-1111-111111111101'
from public.events e
cross join public.rooms r
cross join (values
  ('R01', '11111111-1111-1111-1111-111111111104'),
  ('R02', '11111111-1111-1111-1111-111111111105'),
  ('R03', '11111111-1111-1111-1111-111111111106'),
  ('R04', '11111111-1111-1111-1111-111111111107'),
  ('R05', '11111111-1111-1111-1111-111111111108'),
  ('R06', '11111111-1111-1111-1111-111111111109')
) as v(code, id)
where e.slug = 'xplorer-2026-chapter-4'
  and r.code = v.code
on conflict (room_id, user_id) do update set
  status = 'active',
  assigned_at = now();

-- 10. Coordinator assignments: all-room + one room-scoped.
insert into public.coordinator_assignments (event_id, user_id, room_id, status, assigned_by)
select e.id, u.id, null, 'active', '11111111-1111-1111-1111-111111111101'
from public.events e
cross join (values ('11111111-1111-1111-1111-111111111102')) as u(id)
where e.slug = 'xplorer-2026-chapter-4'
on conflict (event_id, user_id, room_id) where room_id is null do update set
  status = 'active',
  assigned_at = now();

insert into public.coordinator_assignments (event_id, user_id, room_id, status, assigned_by)
select e.id, u.id, r.id, 'active', '11111111-1111-1111-1111-111111111101'
from public.events e
cross join public.rooms r
cross join (values ('11111111-1111-1111-1111-111111111103', 'R01')) as u(id, room_code)
where e.slug = 'xplorer-2026-chapter-4'
  and r.code = u.room_code
on conflict (event_id, user_id, room_id) do update set
  status = 'active',
  assigned_at = now();

-- 11. Schedule items (22 verified items; missing times/locations null).
insert into public.schedule_items (event_id, day_date, starts_at, ends_at, time_label, title, description, location, kind, sequence, is_published, created_by)
select e.id, s.day_date, s.starts_at, s.ends_at, s.time_label, s.title, s.description, s.location, s.kind, s.sequence, true, '11111111-1111-1111-1111-111111111101'
from public.events e
cross join (
  values
    -- Oct 31, 2026
    ('2026-10-31', '2026-10-31 08:30:00+05:30', '2026-10-31 08:45:00+05:30', null, 'Reporting', 'Participant reporting and badge collection', null, 'activity', 1),
    ('2026-10-31', '2026-10-31 09:00:00+05:30', '2026-10-31 09:30:00+05:30', null, 'Registration and escorting', 'Registration desk open; teams escorted to rooms', null, 'activity', 2),
    ('2026-10-31', null, null, '9:30', 'Guest arrival', 'Chief guest arrives at the venue', null, 'ceremony', 3),
    ('2026-10-31', null, null, '9:50', 'Ceremony starts', 'Opening ceremony begins', null, 'ceremony', 4),
    ('2026-10-31', null, null, '10:30', 'Break', '15-minute break', null, 'break', 5),
    ('2026-10-31', '2026-10-31 10:45:00+05:30', '2026-10-31 11:45:00+05:30', null, 'Workshop', 'Skill-building workshop', null, 'activity', 6),
    ('2026-10-31', null, null, '11:45', 'Coding begins', 'Competitive coding window opens', null, 'activity', 7),
    ('2026-10-31', '2026-10-31 13:15:00+05:30', '2026-10-31 14:00:00+05:30', null, 'Lunch', 'Lunch break', null, 'break', 8),
    ('2026-10-31', '2026-10-31 14:00:00+05:30', '2026-10-31 15:00:00+05:30', null, 'Coding', 'Coding session resumes', null, 'activity', 9),
    ('2026-10-31', '2026-10-31 15:00:00+05:30', '2026-10-31 15:20:00+05:30', null, 'Break', '20-minute break', null, 'break', 10),
    ('2026-10-31', '2026-10-31 15:20:00+05:30', '2026-10-31 18:30:00+05:30', null, 'Coding', 'Extended coding block', null, 'activity', 11),
    ('2026-10-31', '2026-10-31 18:30:00+05:30', '2026-10-31 20:30:00+05:30', null, 'Dinner / band / flashmob', 'Dinner with live band and flashmob', null, 'ceremony', 12),
    ('2026-10-31', null, null, 'Rooms with beds', 'Overnight accommodation', 'Rooms allocated with beds for overnight stay', null, 'logistics', 13),
    ('2026-10-31', null, null, 'Midnight snacks around 2:30–3:00 AM', 'Late-night snacks', 'Snacks served around 2:30–3:00 AM', null, 'break', 14),
    -- Nov 1, 2026
    ('2026-11-01', '2026-11-01 07:30:00+05:30', '2026-11-01 08:00:00+05:30', null, 'Breakfast', 'Morning breakfast', null, 'break', 15),
    ('2026-11-01', '2026-11-01 08:00:00+05:30', '2026-11-01 09:30:00+05:30', null, 'Presentation ready', 'Teams finalize presentations', null, 'activity', 16),
    ('2026-11-01', '2026-11-01 09:30:00+05:30', '2026-11-01 10:00:00+05:30', null, 'Ceremony / guest addressing', 'Guest addresses participants', null, 'ceremony', 17),
    ('2026-11-01', null, null, '10:00', 'Participants at auditorium', 'All participants assemble at the auditorium', null, 'activity', 18),
    ('2026-11-01', null, null, '10:30', 'Judging starts', 'Judging of presentations begins', null, 'ceremony', 19),
    ('2026-11-01', null, null, 'Snacks throughout 2 to 3 hrs', 'Snacks', 'Snacks served throughout a 2 to 3 hour window', null, 'break', 20),
    ('2026-11-01', null, null, '12:30', 'Closing ceremony', 'Closing ceremony and vote of thanks', null, 'ceremony', 21),
    ('2026-11-01', null, null, 'Felicitation / awards and dispersal after lunch', 'Awards and dispersal', 'Felicitation and awards, then dispersal after lunch', null, 'ceremony', 22)
) as s(day_date, starts_at, ends_at, time_label, title, description, location, kind, sequence)
where e.slug = 'xplorer-2026-chapter-4'
on conflict (id) do nothing;

-- 12. Teams (12 teams, 2 per room), members, registrations, room assignments.
-- Team definitions: (room_code, name, school_id, member_count)
do $$
declare
  v_event uuid;
  v_team uuid;
  v_leader uuid;
  v_member uuid;
  v_school uuid;
  v_room uuid;
  v_member_count int;
  v_offset int;
  v_pool_count int;
  v_pool_offset int := 0;
  v_seq int := 0;
  team_rec record;
begin
  select id into v_event from public.events where slug = 'xplorer-2026-chapter-4';
  select count(*) into v_pool_count from public.profiles where id::text like '22222222-%';

  for team_rec in
    select *
    from (
      values
        ('R01', 'Alpha Cartographers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 3),
        ('R01', 'Beta Navigators', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 4),
        ('R02', 'Gamma Explorers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', 2),
        ('R02', 'Delta Pathfinders', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', 5),
        ('R03', 'Epsilon Surveyors', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005', 3),
        ('R03', 'Zeta Trailblazers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006', 4),
        ('R04', 'Eta Voyagers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 2),
        ('R04', 'Theta Pioneers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 3),
        ('R05', 'Iota Seekers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', 4),
        ('R05', 'Kappa Adventurers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', 2),
        ('R06', 'Lambda Nomads', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa005', 5),
        ('R06', 'Mu Wayfarers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa006', 3)
    ) as d(room_code text, name text, school_id uuid, member_count int)
  loop
    v_seq := v_seq + 1;
    v_member_count := team_rec.member_count;

    -- Deterministic leader from participant pool
    select id into v_leader from public.profiles where id::text like '22222222-%'
      order by id limit 1 offset (v_pool_offset % v_pool_count);

    insert into public.teams (id, event_id, school_id, name, code, description, leader_user_id, created_by, status)
    values (gen_random_uuid(), v_event, team_rec.school_id, team_rec.name,
            'GE-' || upper(substr(split_part(team_rec.name, ' ', 1), 1, 3)) || lpad(v_seq::text, 2, '0'),
            'Seeded demo team for Xplorer 2026 Chapter 4.', v_leader, '11111111-1111-1111-1111-111111111101', 'forming')
    returning id into v_team;

    -- Room assignment
    select id into v_room from public.rooms where event_id = v_event and code = team_rec.room_code limit 1;
    insert into public.room_assignments (event_id, room_id, team_id, assigned_by)
    values (v_event, v_room, v_team, '11111111-1111-1111-1111-111111111101');

    -- Members + registrations
    for v_offset in 0 .. v_member_count - 1 loop
      select id into v_member from public.profiles where id::text like '22222222-%'
        order by id limit 1 offset ((v_pool_offset + v_offset) % v_pool_count);

      insert into public.event_registrations (event_id, user_id, school_id, status, grade_year, roll_number, responses)
      values (v_event, v_member, team_rec.school_id, 'confirmed', 'Inter 2nd year',
              'X' || lpad((abs(hashtext(v_member::text)) % 999)::text, 3, '0'), '{}'::jsonb)
      on conflict (event_id, user_id) do update set
        school_id = team_rec.school_id, status = 'confirmed';

      insert into public.team_members (team_id, user_id, event_id, role)
      values (v_team, v_member, v_event,
              case when v_member = v_leader then 'leader' else 'member' end);
    end loop;
    v_pool_offset := v_pool_offset + v_member_count;
  end loop;
end $$;

-- Participant memberships (registration creates these; seed them directly for demo).
insert into public.event_memberships (event_id, user_id, role, status, granted_by)
select e.id, reg.user_id, 'participant', 'active', '11111111-1111-1111-1111-111111111101'
from public.events e
join public.event_registrations reg on reg.event_id = e.id
where e.slug = 'xplorer-2026-chapter-4'
on conflict (event_id, user_id, role) do update set
  status = 'active';

-- 13. Announcements (seeded demo announcement).
insert into public.event_announcements (event_id, title, body, audience, is_pinned, published_at, created_by)
select e.id, 'Welcome to Xplorer 2026 — Chapter 4',
  'All teams report by 8:30 AM on October 31 for participant reporting and badge collection.',
  'all', true, '2026-10-30 10:00:00+05:30', '11111111-1111-1111-1111-111111111101'
from public.events e where e.slug = 'xplorer-2026-chapter-4'
on conflict (id) do nothing;

-- 14. Challenge draft (unpublished — official content not yet supplied).
insert into public.event_challenges (event_id, title, summary, sections, is_published, updated_by, version)
select e.id, 'Xplorer Challenge 2026', null, '[]'::jsonb, false, '11111111-1111-1111-1111-111111111101', 1
from public.events e where e.slug = 'xplorer-2026-chapter-4'
on conflict (event_id) do update set
  title = excluded.title,
  is_published = false,
  version = 1,
  updated_at = now();
