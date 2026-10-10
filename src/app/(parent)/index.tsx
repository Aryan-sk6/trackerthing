import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PaywallNotice } from '@/components/PaywallNotice';
import { Card, Empty } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ScanEvent, ScanKind, Student } from '@/lib/types';
import { useSubscription } from '@/lib/useSubscription';
import { colors, radius, spacing } from '@/theme';

interface ChildStatus {
  student: Student;
  kind: ScanKind | null;
  at: string | null;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function ParentToday() {
  const { session } = useAuth();
  const { active, loading: subLoading, refresh: refreshSub } = useSubscription();
  const [children, setChildren] = useState<ChildStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    const { data: links } = await supabase
      .from('parent_students')
      .select('students(*)')
      .eq('parent_id', session.user.id);
    const students = (links ?? []).flatMap((l: any) => (l.students ? [l.students as Student] : []));

    // RLS hides scan events from non-subscribers, so this is empty for them.
    const { data: events } = await supabase
      .from('scan_events')
      .select('student_id, kind, scanned_at')
      .gte('scanned_at', startOfToday())
      .order('scanned_at', { ascending: false });
    const latest = new Map<string, { kind: ScanKind; at: string }>();
    for (const e of (events ?? []) as Pick<ScanEvent, 'student_id' | 'kind' | 'scanned_at'>[]) {
      if (!latest.has(e.student_id)) latest.set(e.student_id, { kind: e.kind, at: e.scanned_at });
    }
    setChildren(
      students.map((s) => ({
        student: s,
        kind: latest.get(s.id)?.kind ?? null,
        at: latest.get(s.id)?.at ?? null,
      })),
    );
    setRefreshing(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void refreshSub();
      void load();
    }, [load, refreshSub]),
  );

  // Live updates: a scan by the driver shows up here instantly (RLS-filtered per parent).
  useEffect(() => {
    if (!active) return;
    const channel = supabase
      .channel('scan-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_events' }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, load]);

  if (subLoading) return null;
  if (!active) return <PaywallNotice />;

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={children}
      keyExtractor={(c) => c.student.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListEmptyComponent={<Empty text="No children linked to your account yet. Ask your school to link your number." />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => {
        const label =
          item.kind === 'board' ? 'On board' : item.kind === 'alight' ? 'Got off' : 'Not boarded yet';
        const color =
          item.kind === 'board' ? colors.success : item.kind === 'alight' ? colors.info : colors.muted;
        return (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.student.full_name}</Text>
              <Text style={styles.muted}>{item.student.school_name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.badge, { backgroundColor: color }]}>{label}</Text>
              {item.at && <Text style={styles.muted}>{new Date(item.at).toLocaleTimeString()}</Text>}
            </View>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, marginTop: 2 },
  badge: {
    color: '#fff',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
