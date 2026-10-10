import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Kamalam, Thoranam } from '@/components/motifs';
import { Button, Card, ScreenHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { getPackages, purchase, restore } from '@/lib/purchases';
import { useSubscription } from '@/lib/useSubscription';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Subscription() {
  const { t, lang } = useI18n();
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
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert(t('errorTitle'), e?.message ?? '');
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
          {active ? <Kamalam size={72} /> : <Thoranam width={120} stroke={colors.indigo} accent={colors.primary} />}
          <Text style={styles.title}>{active ? t('planActive') : t('subscribeTitle')}</Text>
          {active && subscription?.expires_at && (
            <Text style={styles.muted}>
              {new Date(subscription.expires_at).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN')}
            </Text>
          )}
        </View>

        <Card style={{ gap: spacing.md }}>
          {perks.map((p) => (
            <View key={p} style={styles.perk}>
              <View style={styles.tick}>
                <Ionicons name="checkmark" size={18} color="#fff" />
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
              <Button title={t('subscribe')} loading={busy} onPress={() => run(() => purchase(pkg))} />
            </View>
          ))}

        {!active && unavailable && (
          <Text style={styles.muted}>In-app purchases are unavailable in this build. Use a development build with RevenueCat keys configured.</Text>
        )}

        <Button title={t('restore')} variant="secondary" loading={busy} onPress={() => run(restore)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  crest: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  perkText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink },
  plan: {
    backgroundColor: colors.indigo,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.onIndigo },
  planPrice: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 44, color: colors.primary },
});
