import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Thoranam } from '@/components/motifs';
import { Button, ScreenHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { colors, fonts, spacing } from '@/theme';

export function PaywallNotice({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <ScreenHeader title={title} />
      <View style={styles.body}>
        <Thoranam width={140} stroke={colors.indigo} accent={colors.primary} />
        <Text style={styles.title}>{t('subscribeTitle')}</Text>
        <Text style={styles.text}>{t('perkAlerts')}</Text>
        <Text style={styles.text}>{t('perkMap')}</Text>
        <Button title={t('viewPlans')} onPress={() => router.navigate('/(parent)/subscription')} style={{ alignSelf: 'stretch', marginTop: spacing.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.body, fontSize: 16, color: colors.muted, textAlign: 'center' },
});
