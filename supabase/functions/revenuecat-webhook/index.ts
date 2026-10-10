// RevenueCat → Supabase. Keeps public.subscriptions in sync so RLS and push
// notifications can trust server-side state.
// Setup: RevenueCat → Integrations → Webhooks → this URL, with the
// Authorization header set to `Bearer <REVENUECAT_WEBHOOK_SECRET>`.
// RevenueCat app_user_id must equal the Supabase user id (set in configurePurchases).
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ACTIVE = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);
const ENDED = new Set(['EXPIRATION']);

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_SECRET')}`) {
    return new Response('unauthorized', { status: 401 });
  }

  const { event } = await req.json();
  const parentId: string = event.app_user_id;
  // Cancellation keeps access until expiration_at_ms, so only ACTIVE/ENDED change status.
  let status: 'active' | 'expired' | null = null;
  if (ACTIVE.has(event.type)) status = 'active';
  else if (ENDED.has(event.type)) status = 'expired';
  if (!status) return new Response('ignored');

  const { error } = await supabase.from('subscriptions').upsert({
    parent_id: parentId,
    status,
    expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    product_id: event.product_id,
    updated_at: new Date().toISOString(),
  });
  if (error) return new Response(error.message, { status: 500 });
  return new Response('ok');
});
