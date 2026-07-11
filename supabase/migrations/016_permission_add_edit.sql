-- Separate add vs edit article permissions

alter table user_permissions
  add column if not exists can_edit boolean not null default false;

-- Existing can_post authors also get edit until an admin changes it
update user_permissions
set can_edit = true
where can_post = true and can_edit = false;

update user_permissions
set can_post = true, can_edit = true
where email = 'ask@christianarmour.com';

create or replace function check_user_can_edit(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from user_permissions
    where email = lower(trim(p_email)) and can_edit = true
  );
end;
$$;

-- Insert stays on can_post (Can Add). Update requires can_edit (or admin).
drop policy if exists "Authorized users can update posts" on posts;
create policy "Authorized users can update posts"
  on posts for update
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
    or check_user_can_edit(auth.jwt() ->> 'email')
  )
  with check (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
    or check_user_can_edit(auth.jwt() ->> 'email')
  );
