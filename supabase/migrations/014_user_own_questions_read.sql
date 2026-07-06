-- Allow signed-in askers to read all of their own questions (pending or answered)

drop policy if exists "Users can read own questions" on questions;
create policy "Users can read own questions"
  on questions for select
  to authenticated
  using (user_id is not null and user_id = auth.uid());

drop policy if exists "Users read replies to own questions" on question_replies;
create policy "Users read replies to own questions"
  on question_replies for select
  to authenticated
  using (
    exists (
      select 1
      from questions q
      where q.id = question_id
        and q.user_id = auth.uid()
    )
  );
