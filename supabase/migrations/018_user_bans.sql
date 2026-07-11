-- Admin bans for signed-in users (email-keyed, like user_permissions)

create table if not exists user_bans (
  email text primary key,
  reason text,
  banned_by text,
  banned_at timestamptz not null default now(),
  active boolean not null default true
);

alter table user_bans enable row level security;

create or replace function is_user_banned(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return false;
  end if;

  return exists (
    select 1
    from user_bans
    where email = lower(trim(p_email))
      and active = true
  );
end;
$$;

create or replace function get_user_ban_status(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  ban_row user_bans%rowtype;
begin
  select *
  into ban_row
  from user_bans
  where email = lower(trim(p_email))
    and active = true
  limit 1;

  if found then
    return json_build_object(
      'banned', true,
      'reason', coalesce(nullif(trim(ban_row.reason), ''), 'Your account has been banned.'),
      'banned_at', ban_row.banned_at
    );
  end if;

  return json_build_object('banned', false);
end;
$$;

grant execute on function is_user_banned(text) to anon, authenticated;
grant execute on function get_user_ban_status(text) to anon, authenticated;

-- Admins can read all bans; users can read their own ban row
drop policy if exists "Admins can read bans" on user_bans;
create policy "Admins can read bans"
  on user_bans for select
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
    or email = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "Admins can insert bans" on user_bans;
create policy "Admins can insert bans"
  on user_bans for insert
  with check (
    (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
    and lower(trim(email)) <> 'ask@christianarmour.com'
    and lower(trim(email)) <> lower(trim(auth.jwt() ->> 'email'))
  );

drop policy if exists "Admins can update bans" on user_bans;
create policy "Admins can update bans"
  on user_bans for update
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
  )
  with check (
    (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
    and lower(trim(email)) <> 'ask@christianarmour.com'
  );

drop policy if exists "Admins can delete bans" on user_bans;
create policy "Admins can delete bans"
  on user_bans for delete
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
  );

-- Block banned users from interactive writes
drop policy if exists "users can like" on likes;
create policy "users can like"
  on likes for insert
  with check (
    auth.uid() = user_id
    and not is_user_banned(auth.jwt() ->> 'email')
  );

drop policy if exists "users can unlike own" on likes;
create policy "users can unlike own"
  on likes for delete
  using (
    auth.uid() = user_id
    and not is_user_banned(auth.jwt() ->> 'email')
  );

drop policy if exists "users can comment" on comments;
create policy "users can comment"
  on comments for insert
  with check (
    auth.uid() = user_id
    and not is_user_banned(auth.jwt() ->> 'email')
  );

drop policy if exists "Authorized users can insert posts" on posts;
create policy "Authorized users can insert posts"
  on posts for insert
  with check (
    not is_user_banned(auth.jwt() ->> 'email')
    and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_can_post(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Authorized users can update posts" on posts;
create policy "Authorized users can update posts"
  on posts for update
  using (
    not is_user_banned(auth.jwt() ->> 'email')
    and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
      or check_user_can_edit(auth.jwt() ->> 'email')
    )
  )
  with check (
    not is_user_banned(auth.jwt() ->> 'email')
    and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
      or check_user_can_edit(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Anyone can ask questions" on questions;
create policy "Anyone can ask questions"
  on questions for insert
  to anon, authenticated
  with check (
    length(trim(asker_name)) > 0
    and length(trim(body)) > 0
    and length(trim(category)) > 0
    and (
      auth.uid() is null
      or not is_user_banned(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Posters can insert replies" on question_replies;
create policy "Posters can insert replies"
  on question_replies for insert
  with check (
    not is_user_banned(auth.jwt() ->> 'email')
    and check_user_can_post(auth.jwt() ->> 'email')
    and author_id = auth.uid()
  );
