-- Questions & answers flow
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  asker_name text not null,
  category text not null,
  body text not null,
  user_id uuid references auth.users(id) on delete set null,
  wants_credit boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'answered')),
  created_at timestamptz not null default now()
);

create table if not exists question_replies (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  question_id uuid references questions(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists questions_status_idx on questions (status, created_at desc);
create index if not exists question_replies_question_id_idx on question_replies (question_id);
create index if not exists notifications_user_id_idx on notifications (user_id, created_at desc);

alter table questions enable row level security;
alter table question_replies enable row level security;
alter table notifications enable row level security;

drop policy if exists "Anyone can ask questions" on questions;
create policy "Anyone can ask questions"
  on questions for insert
  with check (true);

drop policy if exists "Public can read answered questions" on questions;
create policy "Public can read answered questions"
  on questions for select
  using (status = 'answered');

drop policy if exists "Posters can read all questions" on questions;
create policy "Posters can read all questions"
  on questions for select
  using (check_user_can_post(auth.jwt() ->> 'email'));

drop policy if exists "Posters can update questions" on questions;
create policy "Posters can update questions"
  on questions for update
  using (check_user_can_post(auth.jwt() ->> 'email'));

drop policy if exists "Public read replies to answered questions" on question_replies;
create policy "Public read replies to answered questions"
  on question_replies for select
  using (
    exists (
      select 1 from questions q
      where q.id = question_id and q.status = 'answered'
    )
  );

drop policy if exists "Posters can read all replies" on question_replies;
create policy "Posters can read all replies"
  on question_replies for select
  using (check_user_can_post(auth.jwt() ->> 'email'));

drop policy if exists "Posters can insert replies" on question_replies;
create policy "Posters can insert replies"
  on question_replies for insert
  with check (
    check_user_can_post(auth.jwt() ->> 'email')
    and author_id = auth.uid()
  );

drop policy if exists "Users read own notifications" on notifications;
create policy "Users read own notifications"
  on notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications"
  on notifications for update
  using (user_id = auth.uid());

create or replace function notify_posters_of_new_question()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  poster record;
begin
  for poster in
    select u.id as user_id
    from auth.users u
    inner join user_permissions p on lower(p.email) = lower(u.email)
    where p.can_post = true or p.is_admin = true
  loop
    insert into notifications (user_id, type, title, body, question_id)
    values (
      poster.user_id,
      'new_question',
      'New question received',
      left(new.body, 160),
      new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_question_created_notify_posters on questions;
create trigger on_question_created_notify_posters
  after insert on questions
  for each row
  execute function notify_posters_of_new_question();

create or replace function mark_question_answered_on_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update questions
  set status = 'answered'
  where id = new.question_id;
  return new;
end;
$$;

drop trigger if exists on_question_reply_mark_answered on question_replies;
create trigger on_question_reply_mark_answered
  after insert on question_replies
  for each row
  execute function mark_question_answered_on_reply();

-- Realtime
alter table public.questions replica identity full;
alter table public.question_replies replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'question_replies'
  ) then
    alter publication supabase_realtime add table public.question_replies;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
