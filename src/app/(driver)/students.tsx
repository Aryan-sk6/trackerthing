import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Avatar, Card, Empty, ScreenHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { colors, fonts, spacing } from '@/theme';

export default function RouteStudents() {
  const { t } = useI18n();
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
    <View style={styles.container}>
      <ScreenHeader title={t('tabStudents')} subtitle={`${students.length}`} />
      <FlatList
        contentContainerStyle={styles.list}
        data={students}
        keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Empty text={t('noRecords')} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Avatar name={item.full_name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.muted}>
                {item.school_name}
                {item.class_name ? ` · ${item.class_name}` : ''}
              </Text>
            </View>
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
  name: { ...fonts.bodyBold, fontSize: 17, color: colors.ink },
  muted: { ...fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
});
