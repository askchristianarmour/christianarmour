-- Invite & Earn: Bible Token points, referrals, badges

create table if not exists bible_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  referral_code text not null unique,
  bible_tokens integer not null default 0 check (bible_tokens >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid not null unique references auth.users (id) on delete cascade,
  referral_code text not null,
  inviter_tokens integer not null default 50,
  invitee_tokens integer not null default 25,
  created_at timestamptz not null default now()
);

create index if not exists referrals_inviter_id_idx on referrals (inviter_id);

create table if not exists user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table bible_wallets enable row level security;
alter table referrals enable row level security;
alter table user_badges enable row level security;

drop policy if exists "Users read own wallet" on bible_wallets;
create policy "Users read own wallet"
  on bible_wallets for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users read own referrals" on referrals;
create policy "Users read own referrals"
  on referrals for select
  to authenticated
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

drop policy if exists "Users read own badges" on user_badges;
create policy "Users read own badges"
  on user_badges for select
  to authenticated
  using (user_id = auth.uid());

create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  code text;
  exists_already boolean;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists(select 1 from bible_wallets where referral_code = code) into exists_already;
    exit when not exists_already;
  end loop;
  return code;
end;
$$;

create or replace function ensure_bible_wallet(p_user_id uuid default auth.uid())
returns bible_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet bible_wallets;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into wallet from bible_wallets where user_id = p_user_id;
  if found then
    return wallet;
  end if;

  insert into bible_wallets (user_id, referral_code, bible_tokens)
  values (p_user_id, generate_referral_code(), 0)
  on conflict (user_id) do update set updated_at = now()
  returning * into wallet;

  return wallet;
end;
$$;

create or replace function award_badge_if_eligible(p_user_id uuid, p_tokens integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tokens >= 25 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 'seeker')
    on conflict do nothing;
  end if;
  if p_tokens >= 100 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 'disciple')
    on conflict do nothing;
  end if;
  if p_tokens >= 250 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 'ambassador')
    on conflict do nothing;
  end if;
  if p_tokens >= 500 then
    insert into user_badges (user_id, badge_id) values (p_user_id, 'evangelist')
    on conflict do nothing;
  end if;
end;
$$;

create or replace function claim_referral(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  invitee uuid := auth.uid();
  inviter bible_wallets%rowtype;
  invitee_wallet bible_wallets%rowtype;
  code text := upper(trim(p_code));
  inviter_award integer := 50;
  invitee_award integer := 25;
begin
  if invitee is null then
    return json_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if code is null or length(code) < 4 then
    return json_build_object('ok', false, 'error', 'Invalid invite code');
  end if;

  if exists(select 1 from referrals where invitee_id = invitee) then
    return json_build_object('ok', false, 'error', 'Invite already claimed');
  end if;

  select * into inviter from bible_wallets where referral_code = code;
  if not found then
    return json_build_object('ok', false, 'error', 'Invite code not found');
  end if;

  if inviter.user_id = invitee then
    return json_build_object('ok', false, 'error', 'You cannot use your own invite code');
  end if;

  invitee_wallet := ensure_bible_wallet(invitee);

  insert into referrals (inviter_id, invitee_id, referral_code, inviter_tokens, invitee_tokens)
  values (inviter.user_id, invitee, code, inviter_award, invitee_award);

  update bible_wallets
  set bible_tokens = bible_tokens + inviter_award, updated_at = now()
  where user_id = inviter.user_id
  returning * into inviter;

  update bible_wallets
  set bible_tokens = bible_tokens + invitee_award, updated_at = now()
  where user_id = invitee
  returning * into invitee_wallet;

  perform award_badge_if_eligible(inviter.user_id, inviter.bible_tokens);
  perform award_badge_if_eligible(invitee, invitee_wallet.bible_tokens);

  return json_build_object(
    'ok', true,
    'inviter_tokens', inviter_award,
    'invitee_tokens', invitee_award,
    'balance', invitee_wallet.bible_tokens
  );
end;
$$;

grant execute on function ensure_bible_wallet(uuid) to authenticated;
grant execute on function claim_referral(text) to authenticated;

-- Auto-create wallet when a user signs up (best-effort; app also calls ensure)
create or replace function handle_new_user_bible_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into bible_wallets (user_id, referral_code, bible_tokens)
  values (new.id, generate_referral_code(), 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bible_wallet on auth.users;
create trigger on_auth_user_created_bible_wallet
  after insert on auth.users
  for each row execute function handle_new_user_bible_wallet();
