import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Profile, Role } from './types';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<string | null>;
  verifyOtp: (phone: string, token: string) => Promise<string | null>;
  completeProfile: (role: Role, fullName: string) => Promise<string | null>;
  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'language' | 'notify_board' | 'notify_alight'>>) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Indian numbers: accept 10 digits and prefix +91. */
export function toE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith('91') ? `+${digits}` : `+${digits}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const userId = session?.user.id;

  const loadProfile = useCallback(async (id: string | undefined) => {
    if (!id) return setProfile(null);
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile loads in its own effect (not inside the auth callback) and `loading` stays true
  // until it settles, so route guards never see "signed in, no profile" by mistake.
  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) return setProfile(null);
    setProfileLoading(true);
    void loadProfile(userId).finally(() => setProfileLoading(false));
  }, [sessionReady, userId, loadProfile]);

  const loading = !sessionReady || profileLoading;

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      sendOtp: async (phone) => {
        const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
        return error?.message ?? null;
      },
      verifyOtp: async (phone, token) => {
        const { error } = await supabase.auth.verifyOtp({
          phone: toE164(phone),
          token,
          type: 'sms',
        });
        return error?.message ?? null;
      },
      completeProfile: async (role, fullName) => {
        if (!session) return 'Not signed in';
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          role,
          full_name: fullName,
          phone: session.user.phone ?? null,
        });
        if (!error) await loadProfile(session.user.id);
        return error?.message ?? null;
      },
      updateProfile: async (patch) => {
        if (!session) return 'Not signed in';
        const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
        if (!error) await loadProfile(session.user.id);
        return error?.message ?? null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, profile, loading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
