import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Frieze, Thoranam } from '@/components/motifs';
import { Button, Segmented } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { colors, fonts, spacing } from '@/theme';

export default function Welcome() {
  const { t, lang, setLang } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}>
        <Thoranam width={200} />
        <Text style={styles.name}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>
      <Frieze height={20} />

      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.text}>{t('welcomeBody')}</Text>
        </View>
        <View style={{ gap: spacing.md }}>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: 'te', label: 'తెలుగు' },
              { value: 'en', label: 'English' },
            ]}
          />
          <Button title={t('getStarted')} onPress={() => router.push('/login')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.indigo,
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  name: { fontFamily: fonts.displayHeavy, fontSize: 44, lineHeight: 56, color: colors.onIndigo },
  tagline: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.primary },
  body: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 38, color: colors.ink },
  text: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.muted },
});
