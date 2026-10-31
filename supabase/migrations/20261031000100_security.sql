-- Authorization helpers, audit triggers, RLS, and grants.
-- SECURITY DEFINER helpers are intentionally narrow and set a pinned search_path.

create or replace function public.is_any_principal()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.event_memberships
    where user_id = auth.uid() and role = 'principal' and status = 'active'
  );
$$;

create or replace function public.is_event_member(p_event_id uuid, p_roles public.event_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.event_memberships
    where event_id = p_event_id
      and user_id = auth.uid()
      and status = 'active'
      and (p_roles is null or role = any(p_roles))
  );
$$;

create or replace function public.has_event_role(p_event_id uuid, p_role public.event_role)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.is_event_member(p_event_id, array[p_role]::public.event_role[]);
$$;

create or replace function public.is_event_principal(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_event_role(p_event_id, 'principal');
$$;

create or replace function public.is_event_coordinator(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_event_role(p_event_id, 'coordinator');
$$;

create or replace function public.is_volunteer_for_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_assignments va
    join public.event_memberships m
      on m.event_id = va.event_id and m.user_id = auth.uid()
     and m.role = 'volunteer' and m.status = 'active'
    where va.room_id = p_room_id and va.user_id = auth.uid() and va.status = 'active'
  );
$$;

create or replace function public.is_coordinator_for_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.coordinator_assignments ca
    join public.event_memberships m
      on m.event_id = ca.event_id and m.user_id = auth.uid()
     and m.role = 'coordinator' and m.status = 'active'
    where ca.user_id = auth.uid() and ca.status = 'active'
      and (ca.room_id is null or ca.room_id = p_room_id)
  );
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_volunteer_for_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.room_assignments ra
    join public.volunteer_assignments va
      on va.room_id = ra.room_id and va.user_id = auth.uid() and va.status = 'active'
    where ra.team_id = p_team_id
  );
$$;

create or replace function public.is_coordinator_for_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.room_assignments ra
    join public.coordinator_assignments ca
      on ca.event_id = ra.event_id and ca.user_id = auth.uid() and ca.status = 'active'
    join public.event_memberships m
      on m.event_id = ca.event_id and m.user_id = auth.uid()
     and m.role = 'coordinator' and m.status = 'active'
    where ra.team_id = p_team_id
      and (ca.room_id is null or ca.room_id = ra.room_id)
  );
$$;

create or replace function public.can_view_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.is_team_member(p_team_id)
    or public.is_volunteer_for_team(p_team_id)
    or public.is_coordinator_for_team(p_team_id)
    or exists (
      select 1 from public.teams t
      where t.id = p_team_id and public.is_event_principal(t.event_id)
    );
$$;

create or replace function public.can_view_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.is_volunteer_for_room(p_room_id)
    or public.is_coordinator_for_room(p_room_id)
    or exists (
      select 1 from public.rooms r
      where r.id = p_room_id and public.is_event_principal(r.event_id)
    )
    or exists (
      select 1
      from public.room_assignments ra
      join public.team_members tm on tm.team_id = ra.team_id and tm.user_id = auth.uid()
      where ra.room_id = p_room_id
    );
$$;

create or replace function public.can_view_participant_event(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p_user_id = auth.uid()
    or public.is_event_principal(p_event_id)
    or exists (
      select 1
      from public.team_members tm
      join public.room_assignments ra on ra.team_id = tm.team_id
      join public.coordinator_assignments ca
        on ca.event_id = tm.event_id and ca.user_id = auth.uid() and ca.status = 'active'
      where tm.event_id = p_event_id
        and tm.user_id = p_user_id
        and (ca.room_id is null or ca.room_id = ra.room_id)
    )
    or exists (
      select 1
      from public.team_members tm
      join public.room_assignments ra on ra.team_id = tm.team_id
      where tm.event_id = p_event_id
        and tm.user_id = p_user_id
        and public.is_volunteer_for_room(ra.room_id)
    );
$$;

create or replace function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p_profile_id = auth.uid()
    or exists (
      select 1
      from public.team_members mine
      join public.team_members theirs on theirs.team_id = mine.team_id
      where mine.user_id = auth.uid() and theirs.user_id = p_profile_id
    )
    or exists (
      select 1
      from public.event_memberships target
      where target.user_id = p_profile_id and target.status = 'active'
        and (
          public.is_event_principal(target.event_id)
          or exists (
            select 1
            from public.team_members tm
            join public.room_assignments ra on ra.team_id = tm.team_id
            join public.coordinator_assignments ca
              on ca.event_id = tm.event_id and ca.user_id = auth.uid() and ca.status = 'active'
            where tm.event_id = target.event_id and tm.user_id = p_profile_id
              and (ca.room_id is null or ca.room_id = ra.room_id)
          )
          or exists (
            select 1
            from public.team_members tm
            join public.room_assignments ra on ra.team_id = tm.team_id
            where tm.event_id = target.event_id and tm.user_id = p_profile_id
              and public.is_volunteer_for_room(ra.room_id)
          )
        )
    )
    or exists (
      select 1
      from public.volunteer_assignments va
      join public.coordinator_assignments ca
        on ca.event_id = va.event_id and ca.user_id = auth.uid() and ca.status = 'active'
       and (ca.room_id is null or ca.room_id = va.room_id)
      where va.user_id = p_profile_id and va.status = 'active'
    );
$$;

create or replace function public.can_view_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and (status <> 'draft' or public.is_event_principal(id))
  );
$$;

create or replace function public.can_view_announcement(p_event_id uuid, p_audience public.announcement_audience)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.is_event_member(p_event_id)
    and (
      p_audience = 'all'
      or public.is_event_principal(p_event_id)
      or (p_audience = 'participants' and public.has_event_role(p_event_id, 'participant'))
      or (p_audience = 'volunteers' and public.has_event_role(p_event_id, 'volunteer'))
      or (p_audience = 'coordinators' and public.has_event_role(p_event_id, 'coordinator'))
      or (p_audience = 'principals' and public.is_event_principal(p_event_id))
    );
$$;

create or replace function public.current_event_roles(p_event_id uuid)
returns setof public.event_role
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select distinct role from public.event_memberships
  where event_id = p_event_id and user_id = auth.uid() and status = 'active';
$$;

create or replace function public.audit_event_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (new.event_id, auth.uid(), 'event_role.granted', 'event_membership', new.id,
      jsonb_build_object('user_id', new.user_id, 'role', new.role, 'status', new.status));
  elsif old.status is distinct from new.status or old.role is distinct from new.role then
    insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (new.event_id, auth.uid(), 'event_role.changed', 'event_membership', new.id,
      jsonb_build_object('user_id', new.user_id, 'old_role', old.role, 'new_role', new.role,
        'old_status', old.status, 'new_status', new.status));
  end if;
  return new;
end;
$$;

create or replace function public.audit_event_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (new.id, auth.uid(), 'event.status_changed', 'event', new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if (to_jsonb(old) - 'status' - 'updated_at' - 'published_at' - 'archived_at')
     is distinct from
     (to_jsonb(new) - 'status' - 'updated_at' - 'published_at' - 'archived_at') then
    insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (new.id, auth.uid(), 'event.settings_changed', 'event', new.id, '{}'::jsonb);
  end if;
  return new;
end;
$$;

create or replace function public.audit_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_action text := tg_table_name || '.changed';
  v_event uuid;
  v_entity uuid;
begin
  if tg_op = 'DELETE' then
    v_event := old.event_id;
    v_entity := old.id;
  else
    v_event := new.event_id;
    v_entity := new.id;
  end if;
  insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_event, auth.uid(), v_action, tg_table_name, v_entity,
    jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.audit_check_in_insert()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (new.event_id, auth.uid(), 'check_in.recorded', 'check_in', new.id,
    jsonb_build_object('status', new.status, 'room_id', new.room_id,
      'registration_id', new.registration_id, 'volunteer_user_id', new.volunteer_user_id));
  return new;
end;
$$;

create or replace function public.audit_schedule_publish_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (
    new.event_id,
    auth.uid(),
    case when old.is_published is distinct from new.is_published
      then 'schedule.publish_changed' else 'schedule.updated' end,
    'schedule_item',
    new.id,
    jsonb_build_object('is_published', new.is_published)
  );
  return new;
end;
$$;

create or replace function public.audit_content_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event uuid;
  v_entity uuid;
begin
  if tg_op = 'DELETE' then
    v_event := old.event_id;
    v_entity := old.id;
  else
    v_event := new.event_id;
    v_entity := new.id;
  end if;
  insert into public.audit_logs (event_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_event, auth.uid(), tg_table_name || '.' || lower(tg_op), tg_table_name, v_entity,
    jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger event_memberships_audit
after insert or update on public.event_memberships
for each row execute function public.audit_event_membership_change();
create trigger events_audit_status
after update on public.events
for each row execute function public.audit_event_status_change();
create trigger room_assignments_audit
after insert or update or delete on public.room_assignments
for each row execute function public.audit_assignment_change();
create trigger volunteer_assignments_audit
after insert or update or delete on public.volunteer_assignments
for each row execute function public.audit_assignment_change();
create trigger coordinator_assignments_audit
after insert or update or delete on public.coordinator_assignments
for each row execute function public.audit_assignment_change();
create trigger check_ins_audit
after insert on public.check_ins
for each row execute function public.audit_check_in_insert();
create trigger schedule_items_audit_publish
after update on public.schedule_items
for each row execute function public.audit_schedule_publish_change();
create trigger schedule_items_audit_content
after insert or delete on public.schedule_items
for each row execute function public.audit_content_change();
create trigger rooms_audit_content
after insert or update or delete on public.rooms
for each row execute function public.audit_content_change();
create trigger event_schools_audit_content
after insert or update or delete on public.event_schools
for each row execute function public.audit_content_change();
create trigger announcements_audit_content
after insert or update or delete on public.event_announcements
for each row execute function public.audit_content_change();

-- Safe invitation view excludes token_hash. Clients do not receive the hash.
create view public.team_invitations_safe
with (security_invoker = true) as
select id, event_id, team_id, invited_by, invited_user_id, invitee_email, status,
       expires_at, created_at, responded_at
from public.team_invitations;

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.events enable row level security;
alter table public.event_schools enable row level security;
alter table public.event_memberships enable row level security;
alter table public.event_registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.rooms enable row level security;
alter table public.room_assignments enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.coordinator_assignments enable row level security;
alter table public.check_ins enable row level security;
alter table public.schedule_items enable row level security;
alter table public.event_challenges enable row level security;
alter table public.event_announcements enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (public.can_view_profile(id));
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy schools_select on public.schools for select to authenticated
using (
  exists (
    select 1 from public.event_schools es
    join public.events e on e.id = es.event_id
    where es.school_id = schools.id and (e.status <> 'draft' or public.is_event_principal(e.id))
  )
);
create policy schools_insert_principal on public.schools for insert to authenticated
with check (public.is_any_principal());
create policy schools_update_principal on public.schools for update to authenticated
using (public.is_any_principal()) with check (public.is_any_principal());

create policy events_select on public.events for select to authenticated
using (status <> 'draft' or public.is_event_principal(id));
create policy events_update_principal on public.events for update to authenticated
using (public.is_event_principal(id)) with check (public.is_event_principal(id));

create policy event_schools_select on public.event_schools for select to authenticated
using (public.can_view_event(event_id));
create policy event_schools_insert_principal on public.event_schools for insert to authenticated
with check (public.is_event_principal(event_id));
create policy event_schools_update_principal on public.event_schools for update to authenticated
using (public.is_event_principal(event_id)) with check (public.is_event_principal(event_id));

create policy event_memberships_select on public.event_memberships for select to authenticated
using (user_id = auth.uid() or public.is_event_principal(event_id));

create policy event_registrations_select on public.event_registrations for select to authenticated
using (public.can_view_participant_event(event_id, user_id));

create policy teams_select on public.teams for select to authenticated
using (
  public.can_view_team(id)
  or exists (
    select 1 from public.team_invitations i
    where i.team_id = teams.id and i.invited_user_id = auth.uid() and i.status = 'pending'
  )
);

create policy team_members_select on public.team_members for select to authenticated
using (public.can_view_team(team_id));

create policy team_invitations_select on public.team_invitations for select to authenticated
using (invited_user_id = auth.uid() or invited_by = auth.uid() or public.is_event_principal(event_id));

create policy rooms_select on public.rooms for select to authenticated
using (public.can_view_room(id));
create policy rooms_insert_principal on public.rooms for insert to authenticated
with check (public.is_event_principal(event_id));
create policy rooms_update_principal on public.rooms for update to authenticated
using (public.is_event_principal(event_id)) with check (public.is_event_principal(event_id));

create policy room_assignments_select on public.room_assignments for select to authenticated
using (public.can_view_team(team_id));

create policy volunteer_assignments_select on public.volunteer_assignments for select to authenticated
using (
  user_id = auth.uid()
  or public.is_event_principal(event_id)
  or public.is_coordinator_for_room(room_id)
);

create policy coordinator_assignments_select on public.coordinator_assignments for select to authenticated
using (user_id = auth.uid() or public.is_event_principal(event_id));

create policy check_ins_select on public.check_ins for select to authenticated
using (
  (participant_user_id = auth.uid() and status = 'verified')
  or public.is_event_principal(event_id)
  or public.is_coordinator_for_room(room_id)
  or public.is_volunteer_for_room(room_id)
);

create policy schedule_items_select on public.schedule_items for select to authenticated
using (public.is_event_member(event_id) and (is_published or public.is_event_principal(event_id)));
create policy schedule_items_insert_principal on public.schedule_items for insert to authenticated
with check (public.is_event_principal(event_id));
create policy schedule_items_update_principal on public.schedule_items for update to authenticated
using (public.is_event_principal(event_id)) with check (public.is_event_principal(event_id));
create policy schedule_items_delete_principal on public.schedule_items for delete to authenticated
using (public.is_event_principal(event_id));

create policy event_challenges_select on public.event_challenges for select to authenticated
using (public.is_event_member(event_id) and (is_published or public.is_event_principal(event_id)));

create policy announcements_select on public.event_announcements for select to authenticated
using (public.can_view_announcement(event_id, audience));
create policy announcements_insert_principal on public.event_announcements for insert to authenticated
with check (public.is_event_principal(event_id));
create policy announcements_update_principal on public.event_announcements for update to authenticated
using (public.is_event_principal(event_id)) with check (public.is_event_principal(event_id));
create policy announcements_delete_principal on public.event_announcements for delete to authenticated
using (public.is_event_principal(event_id));

create policy audit_logs_select_principal on public.audit_logs for select to authenticated
using (event_id is not null and public.is_event_principal(event_id));

-- Table privileges: reads are RLS-gated; sensitive writes are RPC-only.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles, public.schools, public.events, public.event_schools,
  public.event_memberships, public.event_registrations, public.teams, public.team_members,
  public.rooms, public.room_assignments, public.volunteer_assignments,
  public.coordinator_assignments, public.check_ins, public.schedule_items,
  public.event_challenges, public.event_announcements, public.audit_logs to authenticated;
grant select on public.team_invitations_safe to authenticated;

grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant insert (name, city, state, created_by), update (name, city, state) on public.schools to authenticated;
grant update (title, category, description, poster_url, venue_name, venue_address, timezone,
  starts_on, ends_on, registration_opens_at, registration_closes_at, min_team_size,
  max_team_size, max_teams, capacity) on public.events to authenticated;
grant insert (event_id, school_id, status, registered_at),
  update (status, registered_at) on public.event_schools to authenticated;
grant insert (event_id, name, code, location, team_capacity, sort_order),
  update (name, code, location, team_capacity, sort_order, status_note) on public.rooms to authenticated;
grant insert (event_id, day_date, starts_at, ends_at, time_label, title, description,
  location, kind, sequence, is_published, created_by),
  update (day_date, starts_at, ends_at, time_label, title, description, location, kind,
  sequence, is_published), delete on public.schedule_items to authenticated;
grant insert (event_id, title, body, audience, is_pinned, published_at, created_by),
  update (title, body, audience, is_pinned, published_at), delete on public.event_announcements to authenticated;

grant execute on function public.current_event_roles(uuid) to authenticated;
