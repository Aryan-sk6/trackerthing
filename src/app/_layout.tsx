import {
  BalooTammudu2_700Bold,
  BalooTammudu2_800ExtraBold,
} from '@expo-google-fonts/baloo-tammudu-2';
import {
  Mukta_400Regular,
  Mukta_500Medium,
  Mukta_600SemiBold,
  Mukta_700Bold,
} from '@expo-google-fonts/mukta';
import { NotoSansTelugu_400Regular, NotoSansTelugu_700Bold } from '@expo-google-fonts/noto-sans-telugu';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BalooTammudu2_700Bold,
    BalooTammudu2_800ExtraBold,
    Mukta_400Regular,
    Mukta_500Medium,
    Mukta_600SemiBold,
    Mukta_700Bold,
    NotoSansTelugu_400Regular,
    NotoSansTelugu_700Bold,
  });

  useEffect(() => {
    // Don't block the app forever if a font fails to load.
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </AuthProvider>
    </I18nProvider>
  );
}
