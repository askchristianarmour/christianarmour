-- Public visibility toggle for answered questions (admin-controlled)

alter table questions
  add column if not exists is_public boolean not null default false;

create index if not exists questions_public_answered_idx
  on questions (is_public, status, created_at desc);

drop policy if exists "Public can read answered questions" on questions;
create policy "Public can read answered questions"
  on questions for select
  using (status = 'answered' and is_public = true);

drop policy if exists "Public read replies to answered questions" on question_replies;
create policy "Public read replies to answered questions"
  on question_replies for select
  using (
    exists (
      select 1
      from questions q
      where q.id = question_id
        and q.status = 'answered'
        and q.is_public = true
    )
  );

create or replace function set_question_public_visibility(p_question_id uuid, p_is_public boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
  ) then
    raise exception 'Only administrators can change question visibility';
  end if;

  update questions
  set is_public = p_is_public
  where id = p_question_id
    and status = 'answered';

  if not found then
    raise exception 'Only answered questions can be made public';
  end if;
end;
$$;

grant execute on function set_question_public_visibility(uuid, boolean) to authenticated;
