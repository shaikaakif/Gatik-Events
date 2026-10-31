-- Transactional RPCs. All authorization is revalidated inside the database.

create or replace function public._require_principal(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_event_principal(p_event_id) then
    raise exception 'Only an event principal may perform this action.' using errcode = '42501';
  end if;
end;
$$;

create or replace function public._audit(
  p_event_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (p_event_id, auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.create_event(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
  v_slug text := lower(trim(payload->>'slug'));
begin
  if auth.uid() is null or not public.is_any_principal() then
    raise exception 'Only an active event principal may create a new event.' using errcode = '42501';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use a lowercase URL slug with letters, numbers, and hyphens.' using errcode = '22023';
  end if;

  insert into public.events (
    slug, title, category, description, venue_name, venue_address, timezone,
    starts_on, ends_on, registration_opens_at, registration_closes_at,
    min_team_size, max_team_size, max_teams, capacity, created_by, status
  )
  values (
    v_slug,
    trim(payload->>'title'),
    coalesce(nullif(payload->>'category', ''), 'other'),
    nullif(trim(coalesce(payload->>'description', '')), ''),
    trim(payload->>'venue_name'),
    nullif(trim(coalesce(payload->>'venue_address', '')), ''),
    coalesce(nullif(payload->>'timezone', ''), 'Asia/Kolkata'),
    (payload->>'starts_on')::date,
    (payload->>'ends_on')::date,
    nullif(payload->>'registration_opens_at', '')::timestamptz,
    nullif(payload->>'registration_closes_at', '')::timestamptz,
    coalesce((payload->>'min_team_size')::smallint, 2),
    coalesce((payload->>'max_team_size')::smallint, 5),
    nullif(payload->>'max_teams', '')::integer,
    nullif(payload->>'capacity', '')::integer,
    auth.uid(),
    'draft'
  )
  returning id into v_id;

  insert into public.event_memberships (event_id, user_id, role, status, granted_by)
  values (v_id, auth.uid(), 'principal', 'active', auth.uid());

  perform public._audit(v_id, 'event.created', 'event', v_id, jsonb_build_object('slug', v_slug));
  return v_id;
end;
$$;

create or replace function public.update_event_status(p_event_id uuid, p_next_status public.event_status)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_current public.event_status;
begin
  perform public._require_principal(p_event_id);
  select status into v_current from public.events where id = p_event_id for update;
  if v_current is null then raise exception 'Event not found.' using errcode = 'P0002'; end if;

  if not (
    (v_current = 'draft' and p_next_status in ('published', 'registration_open', 'archived'))
    or (v_current = 'published' and p_next_status in ('registration_open', 'registration_closed', 'in_progress', 'archived'))
    or (v_current = 'registration_open' and p_next_status in ('registration_closed', 'in_progress', 'archived'))
    or (v_current = 'registration_closed' and p_next_status in ('registration_open', 'in_progress', 'archived'))
    or (v_current = 'in_progress' and p_next_status in ('completed', 'archived'))
    or (v_current = 'completed' and p_next_status in ('archived', 'in_progress'))
  ) then
    raise exception 'Invalid event status transition from % to %.', v_current, p_next_status using errcode = '22023';
  end if;

  update public.events
  set status = p_next_status,
      published_at = case
        when p_next_status in ('published', 'registration_open') and published_at is null then now()
        else published_at end,
      archived_at = case when p_next_status = 'archived' then now() else null end
  where id = p_event_id;
end;
$$;

create or replace function public.assign_event_role(p_event_id uuid, p_email text, p_role public.event_role)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid;
  v_id uuid;
begin
  perform public._require_principal(p_event_id);
  select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then
    raise exception 'No account exists for that email. Ask the person to create and verify an account first.' using errcode = 'P0002';
  end if;

  insert into public.event_memberships (event_id, user_id, role, status, granted_by, granted_at, revoked_at)
  values (p_event_id, v_user, p_role, 'active', auth.uid(), now(), null)
  on conflict (event_id, user_id, role) do update
    set status = 'active', granted_by = auth.uid(), granted_at = now(), revoked_at = null
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.revoke_event_role(p_event_id uuid, p_user_id uuid, p_role public.event_role)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public._require_principal(p_event_id);
  if p_role = 'principal' then
    -- Serialize principal revocation inside this event so two concurrent
    -- revocations cannot remove the final active principal.
    perform pg_advisory_xact_lock(hashtext('principal:' || p_event_id::text));
    if exists (
      select 1 from public.event_memberships
      where event_id = p_event_id and user_id = p_user_id
        and role = 'principal' and status = 'active'
    ) and (
      select count(*) from public.event_memberships
      where event_id = p_event_id and role = 'principal' and status = 'active'
    ) <= 1 then
      raise exception 'The last active principal cannot be revoked.' using errcode = '23514';
    end if;
  end if;
  update public.event_memberships
  set status = 'revoked', revoked_at = now()
  where event_id = p_event_id and user_id = p_user_id and role = p_role and status <> 'revoked';
  if not found then raise exception 'Active membership not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.assign_coordinator(p_event_id uuid, p_user_id uuid, p_room_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
begin
  perform public._require_principal(p_event_id);
  if not exists (
    select 1 from public.event_memberships
    where event_id = p_event_id and user_id = p_user_id and role = 'coordinator' and status = 'active'
  ) then
    raise exception 'Grant the coordinator role before assigning a scope.' using errcode = '23514';
  end if;
  if p_room_id is not null and not exists (
    select 1 from public.rooms where id = p_room_id and event_id = p_event_id
  ) then
    raise exception 'Room does not belong to this event.' using errcode = '23514';
  end if;

  if p_room_id is null then
    update public.coordinator_assignments
    set status = 'inactive'
    where event_id = p_event_id and user_id = p_user_id and status = 'active';
  elsif exists (
    select 1 from public.coordinator_assignments
    where event_id = p_event_id and user_id = p_user_id and room_id is null and status = 'active'
  ) then
    raise exception 'This coordinator already has all-room scope.' using errcode = '23505';
  end if;

  insert into public.coordinator_assignments (event_id, user_id, room_id, status, assigned_by)
  values (p_event_id, p_user_id, p_room_id, 'active', auth.uid())
  on conflict (event_id, user_id, room_id) where room_id is not null and status = 'active'
  do update set assigned_by = auth.uid(), assigned_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.assign_volunteer(p_event_id uuid, p_room_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_id uuid;
begin
  perform public._require_principal(p_event_id);
  if not exists (
    select 1 from public.event_memberships
    where event_id = p_event_id and user_id = p_user_id and role = 'volunteer' and status = 'active'
  ) then
    raise exception 'Grant the volunteer role before assigning a room.' using errcode = '23514';
  end if;
  if not exists (select 1 from public.rooms where id = p_room_id and event_id = p_event_id) then
    raise exception 'Room does not belong to this event.' using errcode = '23514';
  end if;

  update public.volunteer_assignments
  set status = 'inactive'
  where room_id = p_room_id and status = 'active' and user_id <> p_user_id;

  insert into public.volunteer_assignments (event_id, room_id, user_id, status, assigned_by)
  values (p_event_id, p_room_id, p_user_id, 'active', auth.uid())
  on conflict (room_id, user_id) do update
    set status = 'active', assigned_by = auth.uid(), assigned_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.register_for_event(
  p_event_id uuid,
  p_school_id uuid,
  p_grade_year text,
  p_roll_number text default null,
  p_responses jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_count integer;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then raise exception 'Event not found.' using errcode = 'P0002'; end if;
  if v_event.status <> 'registration_open' then
    raise exception 'Registration is not open for this event.' using errcode = '22023';
  end if;
  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'Registration has not opened yet.' using errcode = '22023';
  end if;
  if v_event.registration_closes_at is not null and now() > v_event.registration_closes_at then
    raise exception 'Registration has closed.' using errcode = '22023';
  end if;
  if v_event.capacity is not null then
    select count(*) into v_count from public.event_registrations
    where event_id = p_event_id and status = 'confirmed';
    if v_count >= v_event.capacity then
      raise exception 'This event has reached participant capacity.' using errcode = '23514';
    end if;
  end if;
  if not exists (
    select 1 from public.event_schools
    where event_id = p_event_id and school_id = p_school_id and status in ('registered', 'confirmed')
  ) then
    raise exception 'Select a school registered for this event.' using errcode = '23514';
  end if;

  insert into public.event_registrations (
    event_id, user_id, school_id, status, grade_year, roll_number, responses
  )
  values (
    p_event_id, auth.uid(), p_school_id, 'confirmed', trim(p_grade_year),
    nullif(trim(coalesce(p_roll_number, '')), ''), coalesce(p_responses, '{}'::jsonb)
  )
  on conflict (event_id, user_id) do update
    set school_id = excluded.school_id,
        grade_year = excluded.grade_year,
        roll_number = excluded.roll_number,
        responses = excluded.responses,
        status = 'confirmed',
        cancelled_at = null
  returning id into v_id;

  insert into public.event_memberships (event_id, user_id, role, status, granted_by)
  values (p_event_id, auth.uid(), 'participant', 'active', auth.uid())
  on conflict (event_id, user_id, role) do update
    set status = 'active', revoked_at = null;

  perform public._audit(p_event_id, 'event.registration_confirmed', 'event_registration', v_id,
    jsonb_build_object('school_id', p_school_id));
  return v_id;
end;
$$;

create or replace function public.create_team(
  p_event_id uuid,
  p_name text,
  p_school_id uuid,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team_id uuid;
  v_event public.events%rowtype;
  v_team_count integer;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.event_registrations
    where event_id = p_event_id and user_id = auth.uid() and status = 'confirmed'
  ) then
    raise exception 'A confirmed registration is required to create a team.' using errcode = '42501';
  end if;
  if exists (select 1 from public.team_members where event_id = p_event_id and user_id = auth.uid()) then
    raise exception 'You already belong to a team for this event.' using errcode = '23505';
  end if;
  if not exists (
    select 1 from public.event_schools
    where event_id = p_event_id and school_id = p_school_id and status in ('registered', 'confirmed')
  ) then
    raise exception 'Select a school registered for this event.' using errcode = '23514';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null then raise exception 'Event not found.' using errcode = 'P0002'; end if;
  if v_event.status not in ('registration_open', 'registration_closed', 'in_progress') then
    raise exception 'Teams are not open for this event.' using errcode = '22023';
  end if;

  select count(*) into v_team_count from public.teams where event_id = p_event_id;
  if v_event.max_teams is not null and v_team_count >= v_event.max_teams then
    raise exception 'This event has reached its team limit.' using errcode = '23514';
  end if;

  v_code := 'GE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.teams (event_id, school_id, name, code, description, leader_user_id, created_by)
  values (p_event_id, p_school_id, trim(p_name), v_code, nullif(trim(coalesce(p_description, '')), ''), auth.uid(), auth.uid())
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, event_id, role)
  values (v_team_id, auth.uid(), p_event_id, 'leader');

  perform public._audit(p_event_id, 'team.created', 'team', v_team_id, jsonb_build_object('name', trim(p_name)));
  return v_team_id;
end;
$$;

create or replace function public.invite_team_member(p_team_id uuid, p_email text)
returns table (invitation_id uuid, raw_token text, invitee_email text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_invitee uuid;
  v_invitee_email text;
  v_count integer;
  v_token text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  select * into v_team from public.teams where id = p_team_id for update;
  if v_team.id is null then raise exception 'Team not found.' using errcode = 'P0002'; end if;
  if v_team.leader_user_id <> auth.uid() then
    raise exception 'Only the team leader may invite members.' using errcode = '42501';
  end if;
  if v_team.status not in ('forming', 'complete') then
    raise exception 'This team is not accepting invitations.' using errcode = '22023';
  end if;
  select * into v_event from public.events where id = v_team.event_id;
  if v_event.status not in ('registration_open', 'registration_closed') then
    raise exception 'Team invitations are closed.' using errcode = '22023';
  end if;

  select count(*) into v_count from public.team_members where team_id = p_team_id;
  if v_count >= v_event.max_team_size then
    raise exception 'This team is already full.' using errcode = '23514';
  end if;

  v_invitee_email := lower(trim(p_email));
  select u.id into v_invitee from auth.users u where lower(u.email) = v_invitee_email limit 1;
  if v_invitee is null then raise exception 'No account exists for that email.' using errcode = 'P0002'; end if;
  if v_invitee = auth.uid() then raise exception 'You cannot invite yourself.' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.event_registrations
    where event_id = v_team.event_id and user_id = v_invitee and status = 'confirmed'
  ) then
    raise exception 'The invitee needs a confirmed registration for this event.' using errcode = '23514';
  end if;
  if exists (select 1 from public.team_members where event_id = v_team.event_id and user_id = v_invitee) then
    raise exception 'The invitee already belongs to a team.' using errcode = '23505';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.team_invitations (
    event_id, team_id, invited_by, invited_user_id, invitee_email, token_hash
  ) values (
    v_team.event_id, p_team_id, auth.uid(), v_invitee, v_invitee_email,
    encode(extensions.digest(v_token, 'sha256'), 'hex')
  ) returning id into v_id;

  return query select v_id, v_token, v_invitee_email;
end;
$$;

create or replace function public.get_invitation_by_token(p_token text)
returns table (
  invitation_id uuid, team_id uuid, team_name text, event_id uuid, event_title text,
  invitee_email text, status public.invitation_status, expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select i.id, i.team_id, t.name, i.event_id, e.title, i.invitee_email, i.status, i.expires_at
  from public.team_invitations i
  join public.teams t on t.id = i.team_id
  join public.events e on e.id = i.event_id
  where i.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and i.invited_user_id = auth.uid();
$$;

create or replace function public.accept_team_invitation(p_invitation_id uuid, p_token text default null)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_inv public.team_invitations%rowtype;
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  select * into v_inv from public.team_invitations where id = p_invitation_id for update;
  if v_inv.id is null then raise exception 'Invitation not found.' using errcode = 'P0002'; end if;
  if v_inv.invited_user_id <> auth.uid() then
    raise exception 'This invitation belongs to another account.' using errcode = '42501';
  end if;
  if p_token is not null and v_inv.token_hash <> encode(extensions.digest(p_token, 'sha256'), 'hex') then
    raise exception 'Invitation token is invalid.' using errcode = '42501';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'This invitation is no longer pending.' using errcode = '22023';
  end if;
  if v_inv.expires_at < now() then
    update public.team_invitations set status = 'expired', responded_at = now() where id = v_inv.id;
    raise exception 'This invitation has expired.' using errcode = '22023';
  end if;

  select * into v_team from public.teams where id = v_inv.team_id for update;
  select * into v_event from public.events where id = v_inv.event_id;
  if v_event.status not in ('registration_open', 'registration_closed', 'in_progress') then
    raise exception 'Team joining is closed for this event.' using errcode = '22023';
  end if;
  if exists (select 1 from public.team_members where event_id = v_inv.event_id and user_id = auth.uid()) then
    raise exception 'You already belong to a team for this event.' using errcode = '23505';
  end if;
  select count(*) into v_count from public.team_members where team_id = v_inv.team_id;
  if v_count >= v_event.max_team_size then
    raise exception 'This team is already full.' using errcode = '23514';
  end if;

  insert into public.team_members (team_id, user_id, event_id, role)
  values (v_inv.team_id, auth.uid(), v_inv.event_id, 'member');
  update public.team_invitations set status = 'accepted', responded_at = now() where id = v_inv.id;
  perform public._audit(v_inv.event_id, 'team.invitation_accepted', 'team', v_inv.team_id,
    jsonb_build_object('invitation_id', v_inv.id));
  return v_inv.team_id;
end;
$$;

create or replace function public.decline_team_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  update public.team_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id and invited_user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Pending invitation not found.' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.revoke_team_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_inv public.team_invitations%rowtype;
begin
  select * into v_inv from public.team_invitations where id = p_invitation_id;
  if v_inv.id is null then raise exception 'Invitation not found.' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.teams where id = v_inv.team_id and leader_user_id = auth.uid()) then
    raise exception 'Only the team leader may revoke this invitation.' using errcode = '42501';
  end if;
  update public.team_invitations set status = 'revoked', responded_at = now()
  where id = p_invitation_id and status = 'pending';
end;
$$;

create or replace function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team public.teams%rowtype;
begin
  select * into v_team from public.teams where id = p_team_id for update;
  if v_team.id is null then raise exception 'Team not found.' using errcode = 'P0002'; end if;
  if v_team.leader_user_id <> auth.uid() then
    raise exception 'Only the team leader may remove members.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Use the leave-team action instead of removing yourself.' using errcode = '22023';
  end if;
  if v_team.status = 'locked' then
    raise exception 'This team is locked.' using errcode = '22023';
  end if;
  delete from public.team_members where team_id = p_team_id and user_id = p_user_id;
  if not found then raise exception 'Team member not found.' using errcode = 'P0002'; end if;
  perform public._audit(v_team.event_id, 'team.member_removed', 'team', p_team_id,
    jsonb_build_object('user_id', p_user_id));
end;
$$;

create or replace function public.leave_team(p_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team public.teams%rowtype;
  v_count integer;
begin
  select * into v_team from public.teams where id = p_team_id for update;
  if v_team.id is null then raise exception 'Team not found.' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.team_members where team_id = p_team_id and user_id = auth.uid()) then
    raise exception 'You are not a member of this team.' using errcode = '42501';
  end if;
  select count(*) into v_count from public.team_members where team_id = p_team_id;
  if v_team.leader_user_id = auth.uid() and v_count > 1 then
    raise exception 'Transfer leadership before leaving.' using errcode = '23514';
  end if;

  if v_count = 1 then
    delete from public.teams where id = p_team_id;
  else
    delete from public.team_members where team_id = p_team_id and user_id = auth.uid();
  end if;
  perform public._audit(v_team.event_id, 'team.left', 'team', p_team_id, '{}'::jsonb);
end;
$$;

create or replace function public.transfer_team_leadership(p_team_id uuid, p_new_leader_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team public.teams%rowtype;
begin
  select * into v_team from public.teams where id = p_team_id for update;
  if v_team.id is null then raise exception 'Team not found.' using errcode = 'P0002'; end if;
  if v_team.leader_user_id <> auth.uid() then
    raise exception 'Only the team leader may transfer leadership.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.team_members where team_id = p_team_id and user_id = p_new_leader_user_id) then
    raise exception 'The new leader must be a team member.' using errcode = '23514';
  end if;
  update public.team_members set role = 'member' where team_id = p_team_id and user_id = auth.uid();
  update public.team_members set role = 'leader' where team_id = p_team_id and user_id = p_new_leader_user_id;
  update public.teams set leader_user_id = p_new_leader_user_id where id = p_team_id;
  perform public._audit(v_team.event_id, 'team.leadership_transferred', 'team', p_team_id,
    jsonb_build_object('new_leader_user_id', p_new_leader_user_id));
end;
$$;

create or replace function public.update_team_details(
  p_team_id uuid, p_name text, p_description text, p_school_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
begin
  select * into v_team from public.teams where id = p_team_id for update;
  if v_team.id is null then raise exception 'Team not found.' using errcode = 'P0002'; end if;
  if v_team.leader_user_id <> auth.uid() then
    raise exception 'Only the team leader may edit the team.' using errcode = '42501';
  end if;
  if v_team.status = 'locked' then raise exception 'This team is locked.' using errcode = '22023'; end if;
  select * into v_event from public.events where id = v_team.event_id;
  if v_event.status not in ('registration_open') then
    raise exception 'Team details can only be edited while registration is open.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.event_schools
    where event_id = v_team.event_id and school_id = p_school_id and status in ('registered', 'confirmed')
  ) then
    raise exception 'Select a school registered for this event.' using errcode = '23514';
  end if;

  update public.teams set name = trim(p_name), description = nullif(trim(coalesce(p_description, '')), ''),
    school_id = p_school_id where id = p_team_id;
  perform public._audit(v_team.event_id, 'team.updated', 'team', p_team_id, '{}'::jsonb);
end;
$$;

create or replace function public.assign_team_to_room(p_event_id uuid, p_team_id uuid, p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_count integer;
  v_id uuid;
begin
  perform public._require_principal(p_event_id);
  if not exists (select 1 from public.teams where id = p_team_id and event_id = p_event_id) then
    raise exception 'Team does not belong to this event.' using errcode = '23514';
  end if;
  select * into v_room from public.rooms where id = p_room_id and event_id = p_event_id for update;
  if v_room.id is null then raise exception 'Room does not belong to this event.' using errcode = '23514'; end if;

  select count(*) into v_count from public.room_assignments
  where room_id = p_room_id and team_id <> p_team_id;
  if v_count >= v_room.team_capacity then
    raise exception 'This room has reached team capacity.' using errcode = '23514';
  end if;

  insert into public.room_assignments (event_id, room_id, team_id, assigned_by)
  values (p_event_id, p_room_id, p_team_id, auth.uid())
  on conflict (team_id) do update
    set room_id = excluded.room_id, assigned_by = auth.uid(), assigned_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.update_room_status(
  p_room_id uuid, p_status public.room_status, p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_room public.rooms%rowtype;
  v_allowed boolean;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if v_room.id is null then raise exception 'Room not found.' using errcode = 'P0002'; end if;
  v_allowed := public.is_event_principal(v_room.event_id) or public.is_volunteer_for_room(p_room_id);
  if not v_allowed then raise exception 'You cannot update this room.' using errcode = '42501'; end if;

  update public.rooms set status = p_status, status_note = nullif(trim(coalesce(p_note, '')), ''),
    status_updated_by = auth.uid(), status_updated_at = now()
  where id = p_room_id;
  perform public._audit(v_room.event_id, 'room.status_updated', 'room', p_room_id,
    jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.search_room_participants(p_room_id uuid, p_query text)
returns table (
  registration_id uuid, user_id uuid, full_name text, email text, phone text,
  team_id uuid, team_name text, team_code text, school_name text, grade_year text,
  check_in_status public.check_in_status, checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with authorized as (
    select r.event_id
    from public.rooms r
    where r.id = p_room_id
      and (
        public.is_event_principal(r.event_id)
        or public.is_coordinator_for_room(r.id)
        or public.is_volunteer_for_room(r.id)
      )
  )
  select reg.id, reg.user_id, p.full_name, u.email, p.phone,
    t.id, t.name, t.code, s.name, reg.grade_year,
    ci.status, ci.checked_in_at
  from authorized a
  join public.room_assignments ra on ra.room_id = p_room_id and ra.event_id = a.event_id
  join public.teams t on t.id = ra.team_id
  join public.team_members tm on tm.team_id = t.id
  join public.event_registrations reg on reg.event_id = t.event_id and reg.user_id = tm.user_id
    and reg.status = 'confirmed'
  join public.profiles p on p.id = reg.user_id
  join auth.users u on u.id = reg.user_id
  join public.schools s on s.id = reg.school_id
  left join public.check_ins ci on ci.event_id = reg.event_id and ci.participant_user_id = reg.user_id
    and ci.status = 'verified'
  where trim(coalesce(p_query, '')) = ''
     or p.full_name ilike '%' || trim(p_query) || '%'
     or u.email ilike '%' || trim(p_query) || '%'
     or t.name ilike '%' || trim(p_query) || '%'
     or t.code ilike '%' || trim(p_query) || '%'
     or coalesce(reg.roll_number, '') ilike '%' || trim(p_query) || '%'
  order by p.full_name
  limit 10;
$$;

create or replace function public.record_check_in(
  p_event_id uuid,
  p_room_id uuid,
  p_registration_id uuid,
  p_status public.check_in_status,
  p_subject jsonb default '{}'::jsonb,
  p_notes text default null
)
returns table (check_in_id uuid, was_duplicate boolean, status public.check_in_status)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_reg public.event_registrations%rowtype;
  v_team_id uuid;
  v_existing public.check_ins%rowtype;
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if not public.is_volunteer_for_room(p_room_id) then
    raise exception 'Only the volunteer assigned to this room may record a check-in.' using errcode = '42501';
  end if;
  select * into v_event from public.events where id = p_event_id;
  if v_event.id is null or not exists (
    select 1 from public.rooms where id = p_room_id and event_id = p_event_id
  ) then
    raise exception 'Room does not belong to this event.' using errcode = '23514';
  end if;
  if v_event.status not in ('registration_open', 'registration_closed', 'in_progress') then
    raise exception 'Check-in is not available for this event status.' using errcode = '22023';
  end if;

  if p_status = 'verified' then
    select * into v_reg from public.event_registrations
    where id = p_registration_id and event_id = p_event_id and status = 'confirmed';
    if v_reg.id is null then
      raise exception 'Confirmed registration not found.' using errcode = '23514';
    end if;
    select tm.team_id into v_team_id
    from public.team_members tm
    join public.room_assignments ra on ra.team_id = tm.team_id
    where tm.event_id = p_event_id and tm.user_id = v_reg.user_id and ra.room_id = p_room_id;
    if v_team_id is null then
      raise exception 'This participant is not assigned to your room.' using errcode = '42501';
    end if;

    select * into v_existing from public.check_ins
    where event_id = p_event_id and participant_user_id = v_reg.user_id and status = 'verified';
    if v_existing.id is not null then
      return query select v_existing.id, true, v_existing.status;
      return;
    end if;

    begin
      insert into public.check_ins (
        event_id, room_id, volunteer_user_id, participant_user_id, registration_id,
        team_id, status, subject_name, subject_email, subject_phone, notes
      ) values (
        p_event_id, p_room_id, auth.uid(), v_reg.user_id, v_reg.id, v_team_id,
        'verified', null, null, null, nullif(trim(coalesce(p_notes, '')), '')
      ) returning id into v_id;
    exception when unique_violation then
      select * into v_existing from public.check_ins
      where event_id = p_event_id and participant_user_id = v_reg.user_id and status = 'verified';
      return query select v_existing.id, true, v_existing.status;
      return;
    end;
    return query select v_id, false, 'verified'::public.check_in_status;
    return;
  end if;

  if p_status not in ('unregistered', 'ambiguous', 'flagged') then
    raise exception 'Unsupported check-in outcome.' using errcode = '22023';
  end if;
  v_name := nullif(trim(coalesce(p_subject->>'name', '')), '');
  if v_name is null then
    raise exception 'Record a name for a flagged or unregistered attempt.' using errcode = '23514';
  end if;

  insert into public.check_ins (
    event_id, room_id, volunteer_user_id, participant_user_id, registration_id,
    team_id, status, subject_name, subject_email, subject_phone, notes
  ) values (
    p_event_id, p_room_id, auth.uid(), null, null, null, p_status,
    left(v_name, 120),
    left(nullif(trim(coalesce(p_subject->>'email', '')), ''), 254),
    left(nullif(trim(coalesce(p_subject->>'phone', '')), ''), 24),
    left(nullif(trim(coalesce(p_notes, '')), ''), 500)
  ) returning id into v_id;

  return query select v_id, false, p_status;
end;
$$;

create or replace function public.get_event_operational_stats(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_all boolean;
  v_rooms uuid[];
  v_room_count int;
  v_team_count int;
  v_participant_count int;
  v_checked_in int;
  v_flagged int;
  v_active_rooms int;
begin
  if not (public.is_event_principal(p_event_id) or public.is_event_coordinator(p_event_id)) then
    raise exception 'Operational statistics require coordinator or principal scope.' using errcode = '42501';
  end if;
  v_all := public.is_event_principal(p_event_id) or exists (
    select 1 from public.coordinator_assignments
    where event_id = p_event_id and user_id = auth.uid() and status = 'active' and room_id is null
  );
  select coalesce(array_agg(room_id), array[]::uuid[]) into v_rooms
  from public.coordinator_assignments
  where event_id = p_event_id and user_id = auth.uid() and status = 'active' and room_id is not null;

  select count(*) into v_room_count from public.rooms
  where event_id = p_event_id and (v_all or id = any(v_rooms));
  select count(distinct ra.team_id) into v_team_count
  from public.room_assignments ra where ra.event_id = p_event_id and (v_all or ra.room_id = any(v_rooms));
  select count(distinct tm.user_id) into v_participant_count
  from public.room_assignments ra
  join public.team_members tm on tm.team_id = ra.team_id
  where ra.event_id = p_event_id and (v_all or ra.room_id = any(v_rooms));
  select count(distinct ci.participant_user_id) into v_checked_in
  from public.check_ins ci
  where ci.event_id = p_event_id and ci.status = 'verified'
    and (v_all or ci.room_id = any(v_rooms));
  select count(*) into v_flagged
  from public.check_ins ci
  where ci.event_id = p_event_id and ci.status in ('unregistered', 'ambiguous', 'flagged')
    and (v_all or ci.room_id = any(v_rooms));
  select count(*) into v_active_rooms from public.rooms
  where event_id = p_event_id and status = 'active' and (v_all or id = any(v_rooms));

  return jsonb_build_object(
    'rooms', v_room_count, 'active_rooms', v_active_rooms, 'teams', v_team_count,
    'participants', v_participant_count, 'checked_in', v_checked_in, 'flagged', v_flagged,
    'scope', case when v_all then 'event' else 'assigned_rooms' end
  );
end;
$$;

create or replace function public.add_event_school(
  p_event_id uuid,
  p_school_id uuid default null,
  p_name text default null,
  p_city text default null,
  p_state text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_school uuid;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_city text := nullif(trim(coalesce(p_city, '')), '');
begin
  perform public._require_principal(p_event_id);

  if p_school_id is not null then
    select id into v_school from public.schools where id = p_school_id;
    if v_school is null then raise exception 'School not found.' using errcode = 'P0002'; end if;
  else
    if v_name is null or char_length(v_name) < 2 then
      raise exception 'Enter a school name with at least 2 characters.' using errcode = '22023';
    end if;
    select id into v_school from public.schools
    where lower(name) = lower(v_name) and lower(coalesce(city, '')) = lower(coalesce(v_city, ''))
    limit 1;
    if v_school is null then
      insert into public.schools (name, city, state, created_by)
      values (v_name, v_city, nullif(trim(coalesce(p_state, '')), ''), auth.uid())
      returning id into v_school;
    end if;
  end if;

  insert into public.event_schools (event_id, school_id, status, registered_at)
  values (p_event_id, v_school, 'registered', now())
  on conflict (event_id, school_id) do update
    set status = 'registered',
        registered_at = coalesce(public.event_schools.registered_at, now());

  perform public._audit(p_event_id, 'event_school.added', 'school', v_school, '{}'::jsonb);
  return v_school;
end;
$$;

create or replace function public.update_event_challenge(
  p_event_id uuid, p_title text, p_summary text, p_sections jsonb, p_publish boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public._require_principal(p_event_id);
  if jsonb_typeof(p_sections) <> 'array' then
    raise exception 'Challenge sections must be an array.' using errcode = '22023';
  end if;
  if p_publish and jsonb_array_length(p_sections) = 0 then
    raise exception 'A challenge needs content before it can be published.' using errcode = '22023';
  end if;

  insert into public.event_challenges (
    event_id, title, summary, sections, is_published, updated_by, version
  ) values (
    p_event_id, trim(p_title), nullif(trim(coalesce(p_summary, '')), ''), p_sections,
    p_publish, auth.uid(), 1
  )
  on conflict (event_id) do update
    set title = excluded.title,
        summary = excluded.summary,
        sections = excluded.sections,
        is_published = excluded.is_published,
        updated_by = auth.uid(),
        version = public.event_challenges.version + 1;

  perform public._audit(p_event_id, case when p_publish then 'challenge.published' else 'challenge.saved' end,
    'event_challenge', p_event_id, jsonb_build_object('published', p_publish));
end;
$$;

revoke execute on function public.create_event(jsonb) from anon;
revoke execute on function public.update_event_status(uuid, public.event_status) from anon;
revoke execute on function public.assign_event_role(uuid, text, public.event_role) from anon;
revoke execute on function public.revoke_event_role(uuid, uuid, public.event_role) from anon;
revoke execute on function public.assign_coordinator(uuid, uuid, uuid) from anon;
revoke execute on function public.assign_volunteer(uuid, uuid, uuid) from anon;
revoke execute on function public.register_for_event(uuid, uuid, text, text, jsonb) from anon;
revoke execute on function public.create_team(uuid, text, uuid, text) from anon;
revoke execute on function public.invite_team_member(uuid, text) from anon;
revoke execute on function public.get_invitation_by_token(text) from anon;
revoke execute on function public.accept_team_invitation(uuid, text) from anon;
revoke execute on function public.decline_team_invitation(uuid) from anon;
revoke execute on function public.revoke_team_invitation(uuid) from anon;
revoke execute on function public.remove_team_member(uuid, uuid) from anon;
revoke execute on function public.leave_team(uuid) from anon;
revoke execute on function public.transfer_team_leadership(uuid, uuid) from anon;
revoke execute on function public.update_team_details(uuid, text, text, uuid) from anon;
revoke execute on function public.assign_team_to_room(uuid, uuid, uuid) from anon;
revoke execute on function public.update_room_status(uuid, public.room_status, text) from anon;
revoke execute on function public.search_room_participants(uuid, text) from anon;
revoke execute on function public.record_check_in(uuid, uuid, uuid, public.check_in_status, jsonb, text) from anon;
revoke execute on function public.get_event_operational_stats(uuid) from anon;
revoke execute on function public.add_event_school(uuid, uuid, text, text, text) from anon;
revoke execute on function public.update_event_challenge(uuid, text, text, jsonb, boolean) from anon;
