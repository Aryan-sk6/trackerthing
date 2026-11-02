import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, Empty, ScreenHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/lib/types';
import { colors, fonts, spacing } from '@/theme';

type TripRow = Trip & { scan_events: { count: number }[] };

export default function TripHistory() {
  const { t, locale } = useI18n();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from('trips')
      .select('*, scan_events(count)')
      .order('started_at', { ascending: false })
      .limit(60);
    setTrips((data as TripRow[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('tabHistory')} />
      <FlatList
        contentContainerStyle={styles.list}
        data={trips}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Empty text={t('noRecords')} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.title}>
              {item.kind === 'morning' ? t('morningPickup') : t('eveningDrop')} ·{' '}
              {new Date(item.started_at).toLocaleDateString(locale, { dateStyle: 'medium' })}
            </Text>
            <Text style={styles.muted}>
              {new Date(item.started_at).toLocaleTimeString(locale, { timeStyle: 'short' })}
              {item.ended_at ? ` – ${new Date(item.ended_at).toLocaleTimeString(locale, { timeStyle: 'short' })}` : ' – …'}
              {` · ${item.scan_events?.[0]?.count ?? 0} ${t('scans')}`}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  title: { ...fonts.bodyBold, fontSize: 17, color: colors.ink },
  muted: { ...fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
});
