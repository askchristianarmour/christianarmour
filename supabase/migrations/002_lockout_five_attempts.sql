-- Increase lockout threshold to 5 wrong-password attempts only.
-- Clears any existing lockouts from prior aggressive rules.

update login_attempts
set failed_count = 0, locked_until = null, updated_at = now()
where locked_until is not null or failed_count > 0;

create or replace function get_login_lock_status(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt login_attempts%rowtype;
  v_max_attempts int := 5;
begin
  select * into v_attempt from login_attempts where email = lower(trim(p_email));

  if not found then
    return json_build_object('locked', false, 'remaining', v_max_attempts);
  end if;

  if v_attempt.locked_until is not null and v_attempt.locked_until > now() then
    return json_build_object(
      'locked', true,
      'locked_until', v_attempt.locked_until,
      'remaining', 0
    );
  end if;

  if v_attempt.locked_until is not null and v_attempt.locked_until <= now() then
    update login_attempts
    set failed_count = 0, locked_until = null, updated_at = now()
    where email = lower(trim(p_email));
    return json_build_object('locked', false, 'remaining', v_max_attempts);
  end if;

  return json_build_object(
    'locked', false,
    'remaining', greatest(0, v_max_attempts - v_attempt.failed_count)
  );
end;
$$;

create or replace function record_failed_login(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_max_attempts int := 5;
  v_lock_hours int := 24;
  v_failed int;
  v_locked_until timestamptz;
begin
  insert into login_attempts (email, failed_count, locked_until, updated_at)
  values (v_email, 1, null, now())
  on conflict (email) do update
  set failed_count = login_attempts.failed_count + 1,
      updated_at = now()
  returning failed_count into v_failed;

  if v_failed >= v_max_attempts then
    v_locked_until := now() + (v_lock_hours || ' hours')::interval;
    update login_attempts
    set failed_count = 0, locked_until = v_locked_until, updated_at = now()
    where email = v_email;

    return json_build_object(
      'locked', true,
      'message', 'Too many wrong passwords. Account locked for 24 hours.',
      'remaining', 0
    );
  end if;

  return json_build_object(
    'locked', false,
    'message', format('Invalid email or password. %s attempt(s) remaining.', v_max_attempts - v_failed),
    'remaining', v_max_attempts - v_failed
  );
end;
$$;
