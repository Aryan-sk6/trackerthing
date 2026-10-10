import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Card, Empty, ScreenHeader, SectionTitle } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/theme';

interface Day {
  student_id: string;
  day: string; // YYYY-MM-DD
  first_boarded: string | null;
  last_alighted: string | null;
}

function monthStart(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Child detail: this month's attendance calendar plus per-day times. */
export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';
  const [student, setStudent] = useState<Student | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const start = useMemo(() => monthStart(), []);

  useEffect(() => {
    if (!id) return;
    supabase.from('students').select('*').eq('id', id).maybeSingle().then(({ data }) => setStudent(data as Student | null));
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
    supabase
      .from('attendance_daily')
      .select('*')
      .eq('student_id', id)
      .gte('day', from)
      .order('day', { ascending: false })
      .then(({ data }) => setDays((data as Day[]) ?? []));
  }, [id, start]);

  const presentDays = useMemo(() => new Set(days.map((d) => Number(d.day.slice(8, 10)))), [days]);
  const today = new Date();
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const blanks = (start.getDay() + 6) % 7; // week starts Monday
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }),
  );

  const time = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <View style={styles.container}>
      <ScreenHeader title={student?.full_name ?? '…'} subtitle={student?.school_name} back />
      <ScrollView contentContainerStyle={styles.content}>
        {student && (
          <Card style={styles.hero}>
            <Avatar name={student.full_name} size={60} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.month}>{start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
              <Badge tone="green" icon="checkmark" label={`${t('present')}: ${presentDays.size}`} />
            </View>
          </Card>
        )}

        <SectionTitle>{t('attendance')}</SectionTitle>
        <Card>
          <View style={styles.grid}>
            {weekdays.map((w, i) => (
              <Text key={`w${i}`} style={styles.weekday}>{w}</Text>
            ))}
            {Array.from({ length: blanks }, (_, i) => <View key={`b${i}`} style={styles.cell} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const n = i + 1;
              const present = presentDays.has(n);
              const isToday = n === today.getDate();
              return (
                <View key={n} style={styles.cell}>
                  <View style={[styles.day, present && styles.dayPresent, isToday && styles.dayToday]}>
                    <Text style={[styles.dayText, present && { color: '#fff' }]}>{n}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <SectionTitle>{t('tabLog')}</SectionTitle>
        {days.length === 0 ? (
          <Empty text={t('noRecords')} />
        ) : (
          days.map((d) => (
            <Card key={d.day} style={{ marginBottom: spacing.sm }}>
              <Text style={styles.dayTitle}>{new Date(d.day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
              <Text style={styles.muted}>
                {t('firstBoarded')}: {time(d.first_boarded)} · {t('lastAlighted')}: {time(d.last_alighted)}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  month: { fontFamily: fonts.display, fontSize: 20, lineHeight: 28, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.bodyBold, color: colors.muted, marginBottom: 4 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  dayPresent: { backgroundColor: colors.green },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  dayTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 },
});
