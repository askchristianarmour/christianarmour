-- Article approval workflow: any signed-in user may submit; public only sees approved

alter table posts
  add column if not exists author_id uuid references auth.users (id) on delete set null;

alter table posts
  add column if not exists status text not null default 'approved';

alter table posts
  add column if not exists reviewed_at timestamptz;

alter table posts
  add column if not exists rejection_reason text;

alter table posts drop constraint if exists posts_status_check;
alter table posts add constraint posts_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Existing articles remain public
update posts set status = 'approved' where status is null or status = 'approved';

create index if not exists posts_status_idx on posts (status);
create index if not exists posts_author_id_idx on posts (author_id);

create or replace function is_post_admin(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    lower(trim(p_email)) = 'ask@christianarmour.com'
    or check_user_is_admin(p_email)
  );
end;
$$;

-- Public read: approved only. Authors see own. Admins see all.
drop policy if exists "posts are public" on posts;
create policy "posts are public"
  on posts for select
  using (
    status = 'approved'
    or author_id = auth.uid()
    or is_post_admin(auth.jwt() ->> 'email')
  );

-- Insert: trusted posters publish approved; everyone else submits pending
drop policy if exists "Authorized users can insert posts" on posts;
create policy "Authenticated users can insert posts"
  on posts for insert
  to authenticated
  with check (
    not is_user_banned(auth.jwt() ->> 'email')
    and author_id = auth.uid()
    and (
      (
        -- Trusted: can publish live
        (
          auth.jwt() ->> 'email' = 'ask@christianarmour.com'
          or check_user_can_post(auth.jwt() ->> 'email')
          or check_user_is_admin(auth.jwt() ->> 'email')
        )
        and status = 'approved'
      )
      or (
        -- Community submit: pending only
        status = 'pending'
      )
    )
  );

-- Update: editors/admins, or authors editing their own pending/rejected
drop policy if exists "Authorized users can update posts" on posts;
create policy "Authorized users can update posts"
  on posts for update
  using (
    not is_user_banned(auth.jwt() ->> 'email')
    and (
      is_post_admin(auth.jwt() ->> 'email')
      or check_user_can_edit(auth.jwt() ->> 'email')
      or (
        author_id = auth.uid()
        and status in ('pending', 'rejected')
      )
    )
  )
  with check (
    not is_user_banned(auth.jwt() ->> 'email')
    and (
      is_post_admin(auth.jwt() ->> 'email')
      or check_user_can_edit(auth.jwt() ->> 'email')
      or (
        author_id = auth.uid()
        and status in ('pending', 'rejected')
      )
    )
  );

-- Storage: allow authenticated non-banned users to upload post images
drop policy if exists "Authorized users can upload post images" on storage.objects;
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'posts'
    and not is_user_banned(auth.jwt() ->> 'email')
  );

drop policy if exists "Authorized users can update post images" on storage.objects;
create policy "Authenticated users can update post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'posts'
    and not is_user_banned(auth.jwt() ->> 'email')
  )
  with check (
    bucket_id = 'posts'
    and not is_user_banned(auth.jwt() ->> 'email')
  );
