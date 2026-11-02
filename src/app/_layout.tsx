import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthGate } from '@/components/AuthGate';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AuthProvider>
    </I18nProvider>
  );
}
