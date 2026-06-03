-- Auth schema: profiles, access history, admin audit, RLS, RPCs

create type public.user_role as enum ('admin', 'user');

create type public.account_status as enum (
  'pending_approval',
  'approved',
  'blocked',
  'rejected'
);

create type public.access_event_type as enum (
  'login_success',
  'login_failure',
  'logout',
  'oauth_callback',
  'app_access'
);

create type public.admin_action_type as enum (
  'approve',
  'reject',
  'block',
  'unblock',
  'unlock'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  account_status public.account_status not null default 'pending_approval',
  failed_login_count int not null default 0,
  failed_login_reset_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  blocked_at timestamptz,
  blocked_by uuid references public.profiles (id),
  block_reason text,
  last_login_at timestamptz,
  last_login_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);
create index profiles_account_status_idx on public.profiles (account_status);
create index profiles_role_idx on public.profiles (role);

create table public.access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  event_type public.access_event_type not null,
  provider text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index access_events_user_id_idx on public.access_events (user_id);
create index access_events_created_at_idx on public.access_events (created_at desc);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  action public.admin_action_type not null,
  note text,
  created_at timestamptz not null default now()
);

create index admin_actions_target_user_id_idx on public.admin_actions (target_user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- New auth user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        account_status = 'approved'
        or role = 'admin'
      )
  );
$$;

-- Record auth failure (3 strikes → block)
create or replace function public.record_auth_failure(
  p_email text,
  p_reason text default 'unknown',
  p_provider text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_new_count int;
  v_blocked boolean := false;
begin
  select * into v_profile
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_profile.id is not null then
    v_new_count := v_profile.failed_login_count + 1;

    update public.profiles
    set
      failed_login_count = v_new_count,
      account_status = case
        when v_new_count >= 3 then 'blocked'::public.account_status
        else account_status
      end,
      blocked_at = case when v_new_count >= 3 then now() else blocked_at end,
      block_reason = case
        when v_new_count >= 3 then 'failed_login_threshold'
        else block_reason
      end
    where id = v_profile.id
    returning * into v_profile;

    v_blocked := v_profile.account_status = 'blocked';

    insert into public.access_events (user_id, event_type, provider, metadata)
    values (
      v_profile.id,
      'login_failure',
      p_provider,
      jsonb_build_object('reason', p_reason, 'failed_count', v_new_count)
    );
  end if;

  return jsonb_build_object(
    'blocked', v_blocked,
    'failed_count', coalesce(v_new_count, 0)
  );
end;
$$;

-- Record successful login
create or replace function public.record_auth_success(p_provider text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  update public.profiles
  set
    failed_login_count = 0,
    failed_login_reset_at = null,
    last_login_at = now(),
    last_login_provider = p_provider
  where id = v_uid;

  insert into public.access_events (user_id, event_type, provider)
  values (v_uid, 'login_success', p_provider);
end;
$$;

-- Log app access
create or replace function public.log_app_access(p_metadata jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  insert into public.access_events (user_id, event_type, metadata)
  values (v_uid, 'app_access', p_metadata);
end;
$$;

-- Admin set user status
create or replace function public.admin_set_user_status(
  p_target_user_id uuid,
  p_action public.admin_action_type,
  p_note text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Forbidden: admin only';
  end if;

  select * into v_profile from public.profiles where id = p_target_user_id;
  if v_profile.id is null then
    raise exception 'User not found';
  end if;

  case p_action
    when 'approve' then
      update public.profiles
      set
        account_status = 'approved',
        approved_at = now(),
        approved_by = v_admin_id,
        blocked_at = null,
        blocked_by = null,
        block_reason = null,
        failed_login_count = 0
      where id = p_target_user_id
      returning * into v_profile;
    when 'reject' then
      update public.profiles
      set account_status = 'rejected'
      where id = p_target_user_id
      returning * into v_profile;
    when 'block' then
      update public.profiles
      set
        account_status = 'blocked',
        blocked_at = now(),
        blocked_by = v_admin_id,
        block_reason = coalesce(p_note, 'admin_action')
      where id = p_target_user_id
      returning * into v_profile;
    when 'unblock' then
      update public.profiles
      set
        account_status = 'approved',
        blocked_at = null,
        blocked_by = null,
        block_reason = null
      where id = p_target_user_id
      returning * into v_profile;
    when 'unlock' then
      update public.profiles
      set
        account_status = case
          when approved_at is not null then 'approved'::public.account_status
          else 'pending_approval'::public.account_status
        end,
        failed_login_count = 0,
        blocked_at = null,
        blocked_by = null,
        block_reason = null
      where id = p_target_user_id
      returning * into v_profile;
    else
      raise exception 'Invalid action';
  end case;

  insert into public.admin_actions (admin_id, target_user_id, action, note)
  values (v_admin_id, p_target_user_id, p_action, p_note);

  return v_profile;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.access_events enable row level security;
alter table public.admin_actions enable row level security;

-- profiles policies
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "Users update own safe fields"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin());

-- access_events policies
create policy "Users read own access events"
  on public.access_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins read all access events"
  on public.access_events for select
  to authenticated
  using (public.is_admin());

create policy "Users insert own access events"
  on public.access_events for insert
  to authenticated
  with check (user_id = auth.uid());

-- admin_actions policies
create policy "Admins read admin actions"
  on public.admin_actions for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert admin actions"
  on public.admin_actions for insert
  to authenticated
  with check (public.is_admin());

-- Grant execute on RPCs to authenticated users where appropriate
grant execute on function public.record_auth_failure(text, text, text) to anon, authenticated;
grant execute on function public.record_auth_success(text) to authenticated;
grant execute on function public.log_app_access(jsonb) to authenticated;
grant execute on function public.admin_set_user_status(uuid, public.admin_action_type, text) to authenticated;
