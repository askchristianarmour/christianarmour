-- Ensure storage buckets exist
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('profile', 'profile', true)
on conflict (id) do update set public = true;

-- =========================================================================
-- Policies for 'posts' bucket (public read, authorized authors can write)
-- =========================================================================

-- SELECT policy: Anyone (even anonymous) can view post images
drop policy if exists "Public read access for posts bucket" on storage.objects;
create policy "Public read access for posts bucket"
  on storage.objects for select
  using (bucket_id = 'posts');

-- INSERT policy: Only authenticated users with posting privileges can upload
drop policy if exists "Authorized users can upload post images" on storage.objects;
create policy "Authorized users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'posts' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
      check_user_can_post(auth.jwt() ->> 'email')
    )
  );

-- UPDATE policy: Only authenticated users with posting privileges can edit/upsert
drop policy if exists "Authorized users can update post images" on storage.objects;
create policy "Authorized users can update post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'posts' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
      check_user_can_post(auth.jwt() ->> 'email')
    )
  )
  with check (
    bucket_id = 'posts' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
      check_user_can_post(auth.jwt() ->> 'email')
    )
  );

-- DELETE policy: Only authenticated users with posting privileges can delete
drop policy if exists "Authorized users can delete post images" on storage.objects;
create policy "Authorized users can delete post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'posts' and (
      auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
      check_user_can_post(auth.jwt() ->> 'email')
    )
  );

-- =========================================================================
-- Policies for 'profile' bucket (public read, authenticated users can write their own avatar)
-- =========================================================================

-- SELECT policy: Anyone can view profile avatars
drop policy if exists "Public read access for profile bucket" on storage.objects;
create policy "Public read access for profile bucket"
  on storage.objects for select
  using (bucket_id = 'profile');

-- INSERT policy: Authenticated users can upload their own avatars
drop policy if exists "Authenticated users can upload own avatars" on storage.objects;
create policy "Authenticated users can upload own avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile' and (
      auth.uid() = owner or
      (storage.foldername(name))[1] = auth.uid()::text or
      (storage.foldername(name))[2] = auth.uid()::text or
      name = 'avatars/' || auth.uid()::text || '.png' or
      name = auth.uid()::text || '.png'
    )
  );

-- UPDATE policy: Authenticated users can update their own avatars
drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile' and (
      auth.uid() = owner or
      (storage.foldername(name))[1] = auth.uid()::text or
      (storage.foldername(name))[2] = auth.uid()::text or
      name = 'avatars/' || auth.uid()::text || '.png' or
      name = auth.uid()::text || '.png'
    )
  )
  with check (
    bucket_id = 'profile' and (
      auth.uid() = owner or
      (storage.foldername(name))[1] = auth.uid()::text or
      (storage.foldername(name))[2] = auth.uid()::text or
      name = 'avatars/' || auth.uid()::text || '.png' or
      name = auth.uid()::text || '.png'
    )
  );

-- DELETE policy: Authenticated users can delete their own avatars
drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile' and (
      auth.uid() = owner or
      (storage.foldername(name))[1] = auth.uid()::text or
      (storage.foldername(name))[2] = auth.uid()::text or
      name = 'avatars/' || auth.uid()::text || '.png' or
      name = auth.uid()::text || '.png'
    )
  );
