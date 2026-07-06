-- Notify question asker when a reply is published

create or replace function handle_question_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asker_user_id uuid;
begin
  update questions
  set status = 'answered'
  where id = new.question_id;

  select user_id
  into asker_user_id
  from questions
  where id = new.question_id;

  if asker_user_id is not null then
    insert into notifications (user_id, type, title, body, question_id)
    values (
      asker_user_id,
      'question_answered',
      'Your question was answered',
      left(new.body, 160),
      new.question_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_question_reply_mark_answered on question_replies;
drop trigger if exists on_question_reply_after_insert on question_replies;

create trigger on_question_reply_after_insert
  after insert on question_replies
  for each row
  execute function handle_question_reply_insert();

-- Allow signed-in users to read their own answered questions on the reply detail page
drop policy if exists "Users can read own answered questions" on questions;
create policy "Users can read own answered questions"
  on questions for select
  to authenticated
  using (
    user_id is not null
    and user_id = auth.uid()
    and status = 'answered'
  );

drop policy if exists "Users read replies to own answered questions" on question_replies;
create policy "Users read replies to own answered questions"
  on question_replies for select
  to authenticated
  using (
    exists (
      select 1
      from questions q
      where q.id = question_id
        and q.user_id = auth.uid()
        and q.status = 'answered'
    )
  );
