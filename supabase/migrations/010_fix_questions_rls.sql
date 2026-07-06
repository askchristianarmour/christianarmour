-- Fix question submission RLS issues

-- Re-create insert policy explicitly for anon + authenticated roles
drop policy if exists "Anyone can ask questions" on questions;
create policy "Anyone can ask questions"
  on questions for insert
  to anon, authenticated
  with check (
    length(trim(asker_name)) > 0
    and length(trim(body)) > 0
    and length(trim(category)) > 0
  );

-- Signed-in users can read their own submitted questions (including pending)
drop policy if exists "Users can read own questions" on questions;
create policy "Users can read own questions"
  on questions for select
  to authenticated
  using (user_id is not null and user_id = auth.uid());

-- Re-assert trigger function runs with elevated privileges for poster notifications
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
