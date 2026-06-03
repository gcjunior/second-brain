-- Security hardening: profile privilege escalation, auth failure RPC lockdown

-- Block non-admins from changing privileged profile columns (RLS alone is insufficient).
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Forbidden: cannot change profile id';
  end if;

  if new.role is distinct from old.role
    or new.account_status is distinct from old.account_status
    or new.email is distinct from old.email
    or new.failed_login_count is distinct from old.failed_login_count
    or new.failed_login_reset_at is distinct from old.failed_login_reset_at
    or new.approved_at is distinct from old.approved_at
    or new.approved_by is distinct from old.approved_by
    or new.blocked_at is distinct from old.blocked_at
    or new.blocked_by is distinct from old.blocked_by
    or new.block_reason is distinct from old.block_reason
    or new.last_login_at is distinct from old.last_login_at
    or new.last_login_provider is distinct from old.last_login_provider
  then
    raise exception 'Forbidden: cannot modify protected profile fields';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;

create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_fields();

-- record_auth_failure must only run server-side (service role), not via anon/authenticated clients.
revoke all on function public.record_auth_failure(text, text, text) from public;
revoke all on function public.record_auth_failure(text, text, text) from anon;
revoke all on function public.record_auth_failure(text, text, text) from authenticated;

grant execute on function public.record_auth_failure(text, text, text) to service_role;
