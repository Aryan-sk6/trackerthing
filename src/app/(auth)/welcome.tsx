import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, Button, LanguagePicker } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n, type TKey } from '@/lib/i18n';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const POINTS: { icon: keyof typeof Ionicons.glyphMap; key: TKey }[] = [
  { icon: 'scan', key: 'perkAlerts' },
  { icon: 'map', key: 'perkMap' },
  { icon: 'calendar', key: 'perkLog' },
];

export default function Welcome() {
  const { t } = useI18n();
  const { startDemo } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.top, { paddingTop: insets.top + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <BrandMark size={64} />
        <Text style={styles.name}>{t('appName')}</Text>
        <Text style={styles.title}>{t('welcomeTitle')}</Text>
        <Text style={styles.text}>{t('welcomeBody')}</Text>

        <View style={styles.points}>
          {POINTS.map((p) => (
            <View key={p.key} style={styles.point}>
              <View style={styles.pointIcon}>
                <Ionicons name={p.icon} size={18} color={colors.brand} />
              </View>
              <Text style={styles.pointText}>{t(p.key)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.md }]}>
        <LanguagePicker />
        <Button title={t('getStarted')} onPress={() => router.push('/login')} />
        <Button title={t('tryDemo')} variant="secondary" onPress={() => startDemo('parent')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  name: { ...fonts.bodySemi, fontSize: 16, color: colors.muted, marginTop: spacing.md },
  title: { ...fonts.displayHeavy, fontSize: 34, lineHeight: 40, color: colors.ink },
  text: { ...fonts.body, fontSize: 17, lineHeight: 25, color: colors.muted },
  points: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow,
  },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, ...fonts.bodyMedium, fontSize: 16, color: colors.ink },
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
});
