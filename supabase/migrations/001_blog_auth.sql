-- Posts (public read)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Likes (auth required)
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- Comments (auth required)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Login lockout tracking (no direct client access)
create table if not exists login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz default now()
);

-- Seed sample posts (only if table is empty)
insert into posts (title, content)
select v.title, v.content
from (values
  ('Welcome to Christian Armour', 'Faith, community, and thoughtful reflection — explore posts and join the conversation.'),
  ('Standing Firm in Faith', 'Like the armour of God, we are called to stand with courage. Share what encourages you today.'),
  ('Community Matters', 'Comment below and connect with others on the journey. Your voice belongs here.')
) as v(title, content)
where not exists (select 1 from posts limit 1);

-- RLS
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table login_attempts enable row level security;

-- Posts: public read
drop policy if exists "posts are public" on posts;
create policy "posts are public"
  on posts for select using (true);

-- Likes
drop policy if exists "likes are public read" on likes;
create policy "likes are public read"
  on likes for select using (true);

drop policy if exists "users can like" on likes;
create policy "users can like"
  on likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can unlike own" on likes;
create policy "users can unlike own"
  on likes for delete
  using (auth.uid() = user_id);

-- Comments
drop policy if exists "comments are public read" on comments;
create policy "comments are public read"
  on comments for select using (true);

drop policy if exists "users can comment" on comments;
create policy "users can comment"
  on comments for insert
  with check (auth.uid() = user_id);

-- login_attempts: no policies (only security definer functions access it)

-- Lockout RPCs
create or replace function get_login_lock_status(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt login_attempts%rowtype;
  v_max_attempts int := 3;
begin
  select * into v_attempt from login_attempts where email = lower(trim(p_email));

  if not found then
    return json_build_object('locked', false, 'remaining', v_max_attempts);
  end if;

  if v_attempt.locked_until is not null and v_attempt.locked_until > now() then
    return json_build_object(
      'locked', true,
      'locked_until', v_attempt.locked_until,
      'remaining', 0
    );
  end if;

  if v_attempt.locked_until is not null and v_attempt.locked_until <= now() then
    update login_attempts
    set failed_count = 0, locked_until = null, updated_at = now()
    where email = lower(trim(p_email));
    return json_build_object('locked', false, 'remaining', v_max_attempts);
  end if;

  return json_build_object(
    'locked', false,
    'remaining', greatest(0, v_max_attempts - v_attempt.failed_count)
  );
end;
$$;

create or replace function record_failed_login(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_max_attempts int := 3;
  v_lock_hours int := 24;
  v_failed int;
  v_locked_until timestamptz;
begin
  insert into login_attempts (email, failed_count, locked_until, updated_at)
  values (v_email, 1, null, now())
  on conflict (email) do update
  set failed_count = login_attempts.failed_count + 1,
      updated_at = now()
  returning failed_count into v_failed;

  if v_failed >= v_max_attempts then
    v_locked_until := now() + (v_lock_hours || ' hours')::interval;
    update login_attempts
    set failed_count = 0, locked_until = v_locked_until, updated_at = now()
    where email = v_email;

    return json_build_object(
      'locked', true,
      'message', 'Too many failed attempts. Account locked for 24 hours.',
      'remaining', 0
    );
  end if;

  return json_build_object(
    'locked', false,
    'message', format('Invalid credentials. %s attempt(s) remaining.', v_max_attempts - v_failed),
    'remaining', v_max_attempts - v_failed
  );
end;
$$;

create or replace function reset_login_attempts(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into login_attempts (email, failed_count, locked_until, updated_at)
  values (lower(trim(p_email)), 0, null, now())
  on conflict (email) do update
  set failed_count = 0, locked_until = null, updated_at = now();
end;
$$;

grant execute on function get_login_lock_status(text) to anon, authenticated;
grant execute on function record_failed_login(text) to anon, authenticated;
grant execute on function reset_login_attempts(text) to anon, authenticated;
