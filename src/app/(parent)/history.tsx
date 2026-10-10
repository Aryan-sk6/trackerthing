import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PaywallNotice } from '@/components/PaywallNotice';
import { Card, Empty } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { ScanEvent } from '@/lib/types';
import { useSubscription } from '@/lib/useSubscription';
import { colors, spacing } from '@/theme';

export default function TravelLog() {
  const { active, loading: subLoading } = useSubscription();
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase
      .from('scan_events')
      .select('*, students(full_name, school_name)')
      .order('scanned_at', { ascending: false })
      .limit(200);
    setEvents((data as ScanEvent[]) ?? []);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (subLoading) return null;
  if (!active) return <PaywallNotice />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={(e) => e.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListEmptyComponent={<Empty text="No travel records yet." />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.title}>
            {item.students?.full_name} · {item.kind === 'board' ? 'Boarded' : 'Got off'}
          </Text>
          <Text style={styles.muted}>{new Date(item.scanned_at).toLocaleString()}</Text>
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
