-- Add image_url and comments_enabled columns to posts table
alter table posts add column if not exists image_url text;
alter table posts add column if not exists comments_enabled boolean not null default false;

-- Add UPDATE policy for posts table to allow administrators and authorized authors to modify comments status
drop policy if exists "Authorized users can update posts" on posts;
create policy "Authorized users can update posts"
  on posts for update
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_can_post(auth.jwt() ->> 'email')
  )
  with check (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_can_post(auth.jwt() ->> 'email')
  );
