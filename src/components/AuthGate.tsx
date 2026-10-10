import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

/**
 * Single place that decides where the user belongs, so every screen stays wired together:
 *   signed out            -> (auth)/welcome, login
 *   signed in, no profile -> (auth)/role
 *   signed in + profile   -> (driver) or (parent), never back into (auth)
 * Renders nothing; mount it next to the root navigator.
 */
export function AuthGate() {
  const { session, profile, loading } = useAuth();
  const segments: string[] = useSegments();
  const router = useRouter();
  const navReady = Boolean(useRootNavigationState()?.key);

  useEffect(() => {
    if (!navReady || loading) return;
    const top = segments[0];
    const inAuth = top === '(auth)';
    const onRole = inAuth && segments[1] === 'role';

    if (!session) {
      if (!inAuth) router.replace('/welcome');
    } else if (!profile) {
      if (!onRole) router.replace('/role');
    } else if (inAuth) {
      router.replace('/');
    } else if (top === '(driver)' && profile.role !== 'driver') {
      router.replace('/');
    } else if (top === '(parent)' && profile.role !== 'parent') {
      router.replace('/');
    }
  }, [navReady, loading, session, profile, segments, router]);

  return null;
}
