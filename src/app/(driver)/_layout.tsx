import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { tabIcon, tabScreenOptions } from '@/components/tabBar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function DriverLayout() {
  const { t } = useI18n();
  const { profile } = useAuth();
  if (profile && profile.role !== 'driver') return <Redirect href="/" />;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: t('tabTrip'), tabBarIcon: tabIcon('scan-outline', 'scan') }} />
      <Tabs.Screen name="students" options={{ title: t('tabStudents'), tabBarIcon: tabIcon('people-outline', 'people') }} />
      <Tabs.Screen name="history" options={{ title: t('tabHistory'), tabBarIcon: tabIcon('time-outline', 'time') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabSettings'), tabBarIcon: tabIcon('settings-outline', 'settings') }} />
    </Tabs>
  );
}
