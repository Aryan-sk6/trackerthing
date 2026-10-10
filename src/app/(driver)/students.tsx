import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, Empty } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { colors, spacing } from '@/theme';

export default function RouteStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase.from('students').select('*').order('full_name');
    setStudents((data as Student[]) ?? []);
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
      data={students}
      keyExtractor={(s) => s.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      ListEmptyComponent={<Empty text="No students assigned to your vehicle yet." />}
      renderItem={({ item }) => (
        <Card>
          <View>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.muted}>
              {item.school_name}
              {item.class_name ? ` · ${item.class_name}` : ''}
            </Text>
          </View>
        </Card>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, marginTop: 2 },
});
