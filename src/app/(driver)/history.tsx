import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, Empty } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/lib/types';
import { colors, spacing } from '@/theme';

type TripRow = Trip & { scan_events: { count: number }[] };

export default function TripHistory() {
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
    <FlatList
      contentContainerStyle={styles.list}
      data={trips}
      keyExtractor={(t) => t.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListEmptyComponent={<Empty text="No trips yet." />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.title}>
            {item.kind === 'morning' ? 'Morning pickup' : 'Evening drop'} ·{' '}
            {new Date(item.started_at).toLocaleDateString()}
          </Text>
          <Text style={styles.muted}>
            {new Date(item.started_at).toLocaleTimeString()}
            {item.ended_at ? ` – ${new Date(item.ended_at).toLocaleTimeString()}` : ' – in progress'}
            {` · ${item.scan_events?.[0]?.count ?? 0} scans`}
          </Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  title: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, marginTop: 2 },
});
