import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { unregisterPush } from './notifications';
import { resetPurchases } from './purchases';
import type { Profile, Role } from './types';
import { supabase } from './supabase';

/** Demo mode ("Try the demo"): a local-only session with sample data and no server account. */
export const GUEST_USER_ID = 'guest-user';
const GUEST_KEY = '@schoolride_guest_profile';

export function isGuest(userId: string | null | undefined): boolean {
  return userId === GUEST_USER_ID;
}

function createGuestSession(): Session {
  return {
    access_token: 'guest-access-token',
    refresh_token: 'guest-refresh-token',
    expires_in: 3600 * 24 * 365,
    token_type: 'bearer',
    user: {
      id: GUEST_USER_ID,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as Session['user'],
  };
}

function guestProfile(role: Role, base?: Profile | null): Profile {
  return {
    id: GUEST_USER_ID,
    role,
    full_name: role === 'driver' ? 'Sam Rivera' : 'Demo Parent',
    phone: null,
    language: base?.language ?? 'en',
    notify_board: base?.notify_board ?? true,
    notify_alight: base?.notify_alight ?? true,
  };
}

/** Default dial code for the login screen; set per deployment, editable by the user. */
export const DEFAULT_DIAL_CODE = (process.env.EXPO_PUBLIC_DEFAULT_DIAL_CODE ?? '+1').trim();

/**
 * Builds an E.164 number. A number typed with a leading "+" is taken as already international;
 * otherwise the dial code is prefixed and a single trunk "0" is dropped (e.g. UK 07700 → +447700).
 */
export function toE164(dialCode: string, number: string): string {
  const trimmed = number.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.replace(/\D/g, '')}`;
  const cc = dialCode.replace(/\D/g, '');
  const local = trimmed.replace(/\D/g, '').replace(/^0/, '');
  return `+${cc}${local}`;
}

/** E.164 allows at most 15 digits; 8 is a safe lower bound for real mobile numbers. */
export function isPlausibleE164(e164: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(e164);
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  sendOtp: (e164: string) => Promise<string | null>;
  verifyOtp: (e164: string, token: string) => Promise<string | null>;
  completeProfile: (role: Role, fullName: string) => Promise<string | null>;
  updateProfile: (patch: Partial<Pick<Profile, 'full_name' | 'language' | 'notify_board' | 'notify_alight'>>) => Promise<string | null>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
  startDemo: (role?: Role) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  // Id of the user whose profile has been fetched; while it differs from the session's user,
  // the profile is still loading.
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const userId = session?.user.id;

  const fetchProfile = useCallback(async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    return (data as Profile | null) ?? null;
  }, []);
  const loadProfile = useCallback(async (id: string) => setProfile(await fetchProfile(id)), [fetchProfile]);

  useEffect(() => {
    let cancelled = false;
    // Restore demo mode first, then the real session, so the gate never sees a half-restored state.
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(GUEST_KEY);
        if (stored && !cancelled) {
          setProfile(JSON.parse(stored) as Profile);
          setSession(createGuestSession());
        }
      } catch {
        // Corrupt demo profile: ignore and continue signed out.
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) setSession(data.session);
      setSessionReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (next) setSession(next);
      // Refresh token revoked or expired: drop the stale session (demo mode is unaffected).
      else if (event === 'SIGNED_OUT') {
        setSession((cur) => (isGuest(cur?.user.id) ? cur : null));
        setProfile((cur) => (isGuest(cur?.id) ? cur : null));
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Profile loads in its own effect (not inside the auth callback) and `loading` stays true
  // until it settles, so route guards never see "signed in, no profile" by mistake.
  useEffect(() => {
    if (!sessionReady || !userId || isGuest(userId)) return;
    let cancelled = false;
    void fetchProfile(userId).then((p) => {
      if (cancelled) return;
      setProfile(p);
      setProfileFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionReady, userId, fetchProfile]);

  const profileLoading = !!userId && !isGuest(userId) && profileFor !== userId;
  const loading = !sessionReady || profileLoading;

  const value = useMemo<AuthState>(() => {
    const saveGuest = async (p: Profile) => {
      await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(p));
      setProfile(p);
    };

    const signOut = async () => {
      const id = session?.user.id;
      await AsyncStorage.removeItem(GUEST_KEY);
      if (id && !isGuest(id)) {
        // Stop this device receiving the account's alerts before the session goes away.
        await unregisterPush(id);
        await resetPurchases();
      }
      await supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      setProfileFor(null);
    };

    return {
      session,
      profile,
      loading,
      sendOtp: async (e164) => {
        const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
        return error?.message ?? null;
      },
      verifyOtp: async (e164, token) => {
        const { error } = await supabase.auth.verifyOtp({ phone: e164, token, type: 'sms' });
        return error?.message ?? null;
      },
      completeProfile: async (role, fullName) => {
        if (!session) return 'Not signed in';
        if (isGuest(session.user.id)) {
          await saveGuest({ ...guestProfile(role, profile), full_name: fullName });
          return null;
        }
        // The phone number is copied from the verified auth user by a database trigger.
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          role,
          full_name: fullName,
        });
        if (!error) await loadProfile(session.user.id);
        return error?.message ?? null;
      },
      updateProfile: async (patch) => {
        if (!session) return 'Not signed in';
        if (isGuest(session.user.id)) {
          await saveGuest({ ...(profile ?? guestProfile('parent')), ...patch });
          return null;
        }
        const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
        if (!error) await loadProfile(session.user.id);
        return error?.message ?? null;
      },
      signOut,
      deleteAccount: async () => {
        if (!session) return 'Not signed in';
        if (!isGuest(session.user.id)) {
          await unregisterPush(session.user.id);
          const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
          if (error) return error.message;
        }
        await signOut();
        return null;
      },
      startDemo: (role: Role = 'parent') => {
        const p = guestProfile(role);
        void AsyncStorage.setItem(GUEST_KEY, JSON.stringify(p));
        setSession(createGuestSession());
        setProfile(p);
      },
    };
  }, [session, profile, loading, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
