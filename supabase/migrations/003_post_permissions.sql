-- Create user permissions table
create table if not exists user_permissions (
  email text primary key,
  can_post boolean not null default false,
  is_admin boolean not null default false
);

-- Seed admin user
insert into user_permissions (email, can_post, is_admin)
values ('ask@christianarmour.com', true, true)
on conflict (email) do update
set can_post = true, is_admin = true;

-- Enable RLS
alter table user_permissions enable row level security;

-- Security Definer helper functions to avoid infinite RLS recursion
create or replace function check_user_is_admin(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from user_permissions
    where email = lower(trim(p_email)) and is_admin = true
  );
end;
$$;

create or replace function check_user_can_post(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from user_permissions
    where email = lower(trim(p_email)) and can_post = true
  );
end;
$$;

-- Policies for user_permissions table
drop policy if exists "Anyone can read permissions" on user_permissions;
create policy "Anyone can read permissions"
  on user_permissions for select
  using (true);

drop policy if exists "Admins can manage permissions" on user_permissions;

drop policy if exists "Admins can insert permissions" on user_permissions;
create policy "Admins can insert permissions"
  on user_permissions for insert
  with check (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_is_admin(auth.jwt() ->> 'email')
  );

drop policy if exists "Admins can update permissions" on user_permissions;
create policy "Admins can update permissions"
  on user_permissions for update
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_is_admin(auth.jwt() ->> 'email')
  );

drop policy if exists "Admins can delete permissions" on user_permissions;
create policy "Admins can delete permissions"
  on user_permissions for delete
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_is_admin(auth.jwt() ->> 'email')
  );

-- Policies for posts table to allow insertion
drop policy if exists "Authorized users can insert posts" on posts;
create policy "Authorized users can insert posts"
  on posts for insert
  with check (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_can_post(auth.jwt() ->> 'email')
  );
