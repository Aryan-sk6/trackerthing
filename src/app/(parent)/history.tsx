import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PaywallNotice } from '@/components/PaywallNotice';
import { Badge, Card, Empty, ScreenHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { ScanEvent } from '@/lib/types';
import { useSubscription } from '@/lib/useSubscription';
import { colors, fonts, spacing } from '@/theme';

export default function TravelLog() {
  const { t, lang } = useI18n();
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';
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
  if (!active) return <PaywallNotice title={t('tabLog')} />;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('tabLog')} />
      <FlatList
        contentContainerStyle={styles.list}
        data={events}
        keyExtractor={(e) => e.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Empty text={t('noRecords')} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.students?.full_name}</Text>
              <Text style={styles.muted}>{new Date(item.scanned_at).toLocaleString(locale)}</Text>
            </View>
            {item.kind === 'board' ? (
              <Badge tone="green" icon="checkmark" label={t('boarded')} />
            ) : (
              <Badge tone="indigo" icon="arrow-forward" label={t('gotOff')} />
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
});
