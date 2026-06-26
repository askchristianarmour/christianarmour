import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ATTEMPTS = 5
const LOCK_HOURS = 24

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isWrongCredentials(error: { message?: string; code?: string }) {
  return (
    error.message === 'Invalid login credentials' ||
    error.code === 'invalid_credentials'
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: attempt } = await admin
      .from('login_attempts')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      return new Response(
        JSON.stringify({ error: 'Account locked after too many wrong passwords. Try again after 24 hours.' }),
        { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )

    const { data, error } = await anon.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data.session) {
      if (error && isWrongCredentials(error)) {
        const failed = (attempt?.failed_count ?? 0) + 1
        const lockedUntil =
          failed >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_HOURS * 60 * 60 * 1000).toISOString()
            : null

        await admin.from('login_attempts').upsert({
          email: normalizedEmail,
          failed_count: failed >= MAX_ATTEMPTS ? 0 : failed,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        })

        const remaining = MAX_ATTEMPTS - failed
        const msg = lockedUntil
          ? 'Too many wrong passwords. Account locked for 24 hours.'
          : `Invalid email or password. ${remaining} attempt(s) remaining.`

        return new Response(
          JSON.stringify({ error: msg }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({ error: error?.message ?? 'Sign in failed.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    await admin.from('login_attempts').upsert({
      email: normalizedEmail,
      failed_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Sign in failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
