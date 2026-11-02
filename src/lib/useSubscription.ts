import { useCallback, useEffect, useState } from 'react';
import { isGuest, useAuth } from './auth';
import { supabase } from './supabase';
import type { Subscription } from './types';

/** Demo mode behaves as subscribed so every parent screen can be explored. */
const DEMO_SUBSCRIPTION: Subscription = {
  parent_id: 'guest-user',
  status: 'active',
  product_id: 'demo',
  expires_at: null,
};

/** Server-side subscription state (kept in sync by the RevenueCat webhook). */
export function useSubscription() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const demo = isGuest(userId);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const fetchFor = useCallback(async (id: string) => {
    const { data } = await supabase.from('subscriptions').select('*').eq('parent_id', id).maybeSingle();
    return (data as Subscription | null) ?? null;
  }, []);

  useEffect(() => {
    if (!userId || demo) return;
    let cancelled = false;
    void fetchFor(userId).then((sub) => {
      if (cancelled) return;
      setSubscription(sub);
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, demo, fetchFor]);

  const refresh = useCallback(async () => {
    if (!userId || demo) return;
    setSubscription(await fetchFor(userId));
  }, [userId, demo, fetchFor]);

  const current = demo ? DEMO_SUBSCRIPTION : loadedFor === userId ? subscription : null;
  const loading = !demo && !!userId && loadedFor !== userId;
  const active =
    current?.status === 'active' &&
    (!current.expires_at || new Date(current.expires_at) > new Date());

  return { subscription: current, active, loading, refresh };
}
