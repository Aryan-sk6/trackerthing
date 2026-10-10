import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { Subscription } from './types';

/** Server-side subscription state (kept in sync by the RevenueCat webhook). */
export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('parent_id', session.user.id)
      .maybeSingle();
    setSubscription((data as Subscription | null) ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const active =
    subscription?.status === 'active' &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  return { subscription, active, loading, refresh };
}
