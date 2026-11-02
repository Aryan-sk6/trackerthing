import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button, Card, ScreenHeader } from '@/components/ui';
import { links } from '@/lib/config';
import { useI18n, type TKey } from '@/lib/i18n';
import { getPackages, purchase, restore } from '@/lib/purchases';
import { useSubscription } from '@/lib/useSubscription';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

/** ISO 8601 period from the store ("P1M", "P3M", "P1Y") → "per month" / "every 3 months". */
function periodLabel(t: (k: TKey) => string, iso: string): string {
  const m = /^P(\d+)([DWMY])$/.exec(iso);
  if (!m) return '';
  const unit = m[2] as 'D' | 'W' | 'M' | 'Y';
  if (m[1] === '1') return t(({ D: 'perDay', W: 'perWeek', M: 'perMonth', Y: 'perYear' } as const)[unit]);
  return t(({ D: 'everyNDays', W: 'everyNWeeks', M: 'everyNMonths', Y: 'everyNYears' } as const)[unit]).replace('{n}', m[1]);
}

export default function Subscription() {
  const { t, locale } = useI18n();
  const { subscription, active, refresh } = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    getPackages()
      .then(setPackages)
      .catch(() => setUnavailable(true));
  }, []);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    try {
      const ok = await action();
      // The RevenueCat webhook updates the server row; give it a moment, then re-read.
      setTimeout(refresh, 2000);
      if (!ok) Alert.alert(t('noPlan'));
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string } | null;
      if (!err?.userCancelled) Alert.alert(t('errorTitle'), err?.message ?? '');
    } finally {
      setBusy(false);
    }
  }

  const perks = [t('perkAlerts'), t('perkMap'), t('perkLog')];

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('tabPlan')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.crest}>
          <Ionicons name={active ? 'checkmark-circle' : 'notifications-circle'} size={80} color={active ? colors.success : colors.brand} />
          <Text style={styles.title}>{active ? t('planActive') : t('subscribeTitle')}</Text>
          {active && subscription?.expires_at && (
            <Text style={styles.muted}>
              {t('renews')} {new Date(subscription.expires_at).toLocaleDateString(locale, { dateStyle: 'long' })}
            </Text>
          )}
        </View>

        <Card style={{ gap: spacing.md }}>
          {perks.map((p) => (
            <View key={p} style={styles.perk}>
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={18} color={colors.success} />
              </View>
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
        </Card>

        {!active &&
          packages.map((pkg) => (
            <View key={pkg.identifier} style={styles.plan}>
              <Text style={styles.planTitle}>{pkg.product.title}</Text>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
              {pkg.product.subscriptionPeriod ? (
                <Text style={styles.planPeriod}>{periodLabel(t, pkg.product.subscriptionPeriod)}</Text>
              ) : null}
              <Button title={t('subscribe')} loading={busy} onPress={() => run(() => purchase(pkg))} />
            </View>
          ))}

        {!active && unavailable && (
          <Text style={styles.muted}>{t('iapUnavailable')}</Text>
        )}

        <Button title={t('restore')} variant="secondary" loading={busy} onPress={() => run(restore)} />

        {!active && packages.length > 0 && <Text style={styles.legal}>{t('autoRenewTerms')}</Text>}
        <View style={styles.legalLinks}>
          {links.terms && (
            <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(links.terms!)}>
              {t('terms')}
            </Text>
          )}
          {links.privacy && (
            <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(links.privacy!)}>
              {t('privacy')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  crest: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  title: { ...fonts.display, fontSize: 24, color: colors.ink, textAlign: 'center' },
  muted: { ...fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  perkText: { flex: 1, ...fonts.bodySemi, fontSize: 16, color: colors.ink },
  plan: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.brand,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow,
  },
  planTitle: { ...fonts.bodySemi, fontSize: 16, color: colors.muted },
  planPrice: { ...fonts.displayHeavy, fontSize: 34, color: colors.ink },
  planPeriod: { ...fonts.body, fontSize: 15, color: colors.muted, marginBottom: spacing.sm },
  legal: { ...fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  link: { ...fonts.bodySemi, fontSize: 14, color: colors.brand, textDecorationLine: 'underline' },
});
