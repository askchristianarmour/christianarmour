-- Allow admins to delete posts; ensure admins can update any post

drop policy if exists "Authorized users can update posts" on posts;
create policy "Authorized users can update posts"
  on posts for update
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
    or check_user_can_post(auth.jwt() ->> 'email')
  )
  with check (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
    or check_user_can_post(auth.jwt() ->> 'email')
  );

drop policy if exists "Admins can delete posts" on posts;
create policy "Admins can delete posts"
  on posts for delete
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com'
    or check_user_is_admin(auth.jwt() ->> 'email')
  );
