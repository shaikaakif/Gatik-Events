-- Custom-auth token consumption and intentionally public event content.
-- Apply only to a clean development project after reviewing the full migration set.

alter table public.app_users enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.email_verification_tokens enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.auth_rate_limits enable row level security;
alter table public.auth_audit_logs enable row level security;

revoke all on public.app_users, public.auth_sessions, public.email_verification_tokens,
  public.password_reset_tokens, public.auth_rate_limits, public.auth_audit_logs
from anon, authenticated;

-- Principals may resolve the minimum account identity for users in their events.
-- Password hashes and account-security columns receive no client grant.
grant select (id, email, full_name) on public.app_users to authenticated;
create policy app_users_select_scoped
on public.app_users for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.event_memberships target
    where target.user_id = app_users.id
      and target.status = 'active'
      and public.is_event_principal(target.event_id)
  )
);

create or replace function public.consume_email_verification_token(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  update public.email_verification_tokens
  set consumed_at = now()
  where token_hash = p_token_hash
    and consumed_at is null
    and expires_at > now()
  returning user_id into v_user_id;

  if v_user_id is null then
    return null;
  end if;

  update public.app_users
  set email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
  where id = v_user_id and status = 'active';

  insert into public.auth_audit_logs (user_id, action, result)
  values (v_user_id, 'email_verified', 'success');
  return v_user_id;
end;
$$;

create or replace function public.consume_password_reset_token(
  p_token_hash text,
  p_password_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  update public.password_reset_tokens
  set consumed_at = now()
  where token_hash = p_token_hash
    and consumed_at is null
    and expires_at > now()
  returning user_id into v_user_id;

  if v_user_id is null then
    return null;
  end if;

  update public.app_users
  set password_hash = p_password_hash,
      password_changed_at = now(),
      updated_at = now()
  where id = v_user_id and status = 'active';

  update public.auth_sessions
  set revoked_at = now()
  where user_id = v_user_id and revoked_at is null;

  insert into public.auth_audit_logs (user_id, action, result)
  values (v_user_id, 'password_reset', 'success');
  return v_user_id;
end;
$$;

revoke all on function public.consume_email_verification_token(text) from public, anon, authenticated;
revoke all on function public.consume_password_reset_token(text, text) from public, anon, authenticated;
grant execute on function public.consume_email_verification_token(text) to service_role;
grant execute on function public.consume_password_reset_token(text, text) to service_role;

-- The directory and introduction expose only published event facts.
grant select on public.events, public.schedule_items, public.event_challenges to anon;

create policy events_select_public
on public.events for select to anon
using (status in ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'archived'));

create policy schedule_items_select_public
on public.schedule_items for select to anon
using (
  is_published
  and exists (
    select 1 from public.events e
    where e.id = schedule_items.event_id
      and e.status in ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'archived')
  )
);

create policy event_challenges_select_public
on public.event_challenges for select to anon
using (
  is_published
  and exists (
    select 1 from public.events e
    where e.id = event_challenges.event_id
      and e.status in ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'archived')
  )
);
