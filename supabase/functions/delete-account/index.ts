// Deletes the calling user's account (App Store guideline 5.1.1(v): in-app account deletion).
// Called from Settings → Delete account with the user's own JWT; no secret needed.
// Removing the auth user cascades to profiles, push_tokens, subscriptions and parent_students.
// Trips keep the school's history with driver_id set to null.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const jwt = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!jwt) return new Response('unauthorized', { status: 401 });

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return new Response('unauthorized', { status: 401 });

  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) return new Response(delError.message, { status: 500 });
  return new Response('deleted');
});
