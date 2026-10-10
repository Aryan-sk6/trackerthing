import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { registerForPush } from '@/lib/notifications';
import { configurePurchases } from '@/lib/purchases';
import { colors } from '@/theme';

export default function ParentLayout() {
  const { profile, session } = useAuth();

  useEffect(() => {
    if (!session) return;
    configurePurchases(session.user.id);
    void registerForPush(session.user.id);
  }, [session]);

  if (profile && profile.role !== 'parent') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarLabel: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'Travel log', tabBarLabel: 'Log' }} />
      <Tabs.Screen name="subscription" options={{ title: 'Subscription', tabBarLabel: 'Plan' }} />
    </Tabs>
  );
}
