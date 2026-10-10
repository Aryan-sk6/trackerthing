import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function DriverLayout() {
  const { profile } = useAuth();
  if (profile && profile.role !== 'driver') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trip', tabBarLabel: 'Trip' }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarLabel: 'Students' }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarLabel: 'History' }} />
    </Tabs>
  );
}
