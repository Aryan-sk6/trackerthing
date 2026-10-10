// Triggered by a Database Webhook on INSERT into public.scan_events.
// Sends an Expo push notification to every subscribed parent of the student.
// Setup: Dashboard → Database → Webhooks → scan_events INSERT → this function,
// with header `Authorization: Bearer <WEBHOOK_SECRET>`.
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('WEBHOOK_SECRET')}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const { record } = await req.json();
  const { student_id, kind, scanned_at } = record;

  const { data: student } = await supabase
    .from('students')
    .select('full_name, parent_students(parent_id)')
    .eq('id', student_id)
    .single();
  if (!student) return new Response('student not found', { status: 404 });

  const parentIds: string[] = student.parent_students.map((p: any) => p.parent_id);
  if (parentIds.length === 0) return new Response('no parents', { status: 200 });

  // Only parents with an active subscription are notified.
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('parent_id')
    .in('parent_id', parentIds)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  const paidIds = (subs ?? []).map((s) => s.parent_id);
  if (paidIds.length === 0) return new Response('no subscribed parents', { status: 200 });

  // Respect each parent's notification settings (Settings → Alerts).
  const prefColumn = kind === 'board' ? 'notify_board' : 'notify_alight';
  const { data: wanting } = await supabase
    .from('profiles')
    .select('id')
    .in('id', paidIds)
    .eq(prefColumn, true);
  const paid = (wanting ?? []).map((p) => p.id);
  if (paid.length === 0) return new Response('alerts muted', { status: 200 });

  const { data: tokens } = await supabase.from('push_tokens').select('token').in('user_id', paid);

  const time = new Date(scanned_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
  const body =
    kind === 'board'
      ? `${student.full_name} boarded the vehicle at ${time}.`
      : `${student.full_name} got off the vehicle at ${time}.`;

  const messages = (tokens ?? []).map((t) => ({
    to: t.token,
    title: kind === 'board' ? 'Boarded' : 'Dropped off',
    body,
    sound: 'default',
    channelId: 'boarding',
    priority: 'high',
  }));

  if (messages.length > 0) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) return new Response(await res.text(), { status: 502 });
  }
  return new Response('ok');
});
