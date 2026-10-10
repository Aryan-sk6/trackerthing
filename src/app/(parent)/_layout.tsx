import * as Notifications from 'expo-notifications';
import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { tabIcon, tabScreenOptions } from '@/components/tabBar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { registerForPush } from '@/lib/notifications';
import { configurePurchases } from '@/lib/purchases';

export default function ParentLayout() {
  const { t } = useI18n();
  const { profile, session } = useAuth();

  useEffect(() => {
    if (!session) return;
    configurePurchases(session.user.id);
    void registerForPush(session.user.id);
  }, [session]);

  // Tapping a boarding alert opens that child's detail (or Home if no child id is attached).
  useEffect(() => {
    const open = (data: Record<string, unknown> | undefined) => {
      const id = typeof data?.student_id === 'string' ? data.student_id : null;
      if (id) router.push({ pathname: '/child/[id]', params: { id } });
      else router.navigate('/(parent)');
    };
    const sub = Notifications.addNotificationResponseReceivedListener((r) =>
      open(r.notification.request.content.data),
    );
    // App opened cold from a notification tap.
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last.notification.request.content.data);
    return () => sub.remove();
  }, []);

  if (profile && profile.role !== 'parent') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: tabIcon('map-outline', 'map') }} />
      <Tabs.Screen name="history" options={{ title: t('tabLog'), tabBarIcon: tabIcon('document-text-outline', 'document-text') }} />
      <Tabs.Screen name="subscription" options={{ title: t('tabPlan'), tabBarIcon: tabIcon('ribbon-outline', 'ribbon') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabSettings'), tabBarIcon: tabIcon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
