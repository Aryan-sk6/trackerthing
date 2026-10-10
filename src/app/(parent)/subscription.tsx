import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { getPackages, purchase, restore } from '@/lib/purchases';
import { useSubscription } from '@/lib/useSubscription';
import { colors, spacing } from '@/theme';

export default function Subscription() {
  const { signOut } = useAuth();
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
      if (!ok) Alert.alert('No active subscription found');
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Text style={styles.heading}>{active ? 'Subscription active' : 'No active plan'}</Text>
        {active && subscription?.expires_at && (
          <Text style={styles.muted}>
            Renews / expires {new Date(subscription.expires_at).toLocaleDateString()}
          </Text>
        )}
      </Card>

      {!active &&
        packages.map((pkg) => (
          <Card key={pkg.identifier} style={{ gap: spacing.sm }}>
            <Text style={styles.heading}>{pkg.product.title}</Text>
            <Text style={styles.muted}>{pkg.product.description}</Text>
            <Button
              title={`Subscribe · ${pkg.product.priceString}`}
              loading={busy}
              onPress={() => run(() => purchase(pkg))}
            />
          </Card>
        ))}

      {!active && unavailable && (
        <Text style={styles.muted}>
          In-app purchases are unavailable in this build. Use a development build with RevenueCat keys
          configured.
        </Text>
      )}

      <Button title="Restore purchases" variant="secondary" loading={busy} onPress={() => run(restore)} />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
});
