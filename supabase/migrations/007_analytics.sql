-- Create analytics_views table
create table if not exists analytics_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  post_id uuid references posts(id) on delete cascade,
  post_title text,
  action text not null, -- 'visit' (site access) or 'read' (read a post)
  created_at timestamptz default now()
);

-- Enable RLS
alter table analytics_views enable row level security;

-- INSERT policy: Allow anyone (authenticated or anonymous) to insert logs
drop policy if exists "Allow anyone to insert analytics" on analytics_views;
create policy "Allow anyone to insert analytics"
  on analytics_views for insert
  with check (true);

-- SELECT policy: Only administrators can read analytics data
drop policy if exists "Admins can select analytics" on analytics_views;
create policy "Admins can select analytics"
  on analytics_views for select
  to authenticated
  using (
    auth.jwt() ->> 'email' = 'ask@christianarmour.com' or
    check_user_is_admin(auth.jwt() ->> 'email')
  );
