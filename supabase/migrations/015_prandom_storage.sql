-- Random article cover pool bucket (public read, admin-only write)

insert into storage.buckets (id, name, public)
values ('prandom', 'prandom', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read access for prandom bucket" on storage.objects;
create policy "Public read access for prandom bucket"
  on storage.objects for select
  using (bucket_id = 'prandom');

drop policy if exists "Admins can upload prandom images" on storage.objects;
create policy "Admins can upload prandom images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'prandom' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Admins can update prandom images" on storage.objects;
create policy "Admins can update prandom images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'prandom' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
  )
  with check (
    bucket_id = 'prandom' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Admins can delete prandom images" on storage.objects;
create policy "Admins can delete prandom images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'prandom' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com'
      or check_user_is_admin(auth.jwt() ->> 'email')
    )
  );
