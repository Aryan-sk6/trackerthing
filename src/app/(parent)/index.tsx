import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaywallNotice } from '@/components/PaywallNotice';
import { RouteMap } from '@/components/RouteMap';
import { Avatar, Badge, Button, Empty, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { nearestStopIndex } from '@/lib/geo';
import { useI18n } from '@/lib/i18n';
import { useParentData, type Child } from '@/lib/useParentData';
import { useSubscription } from '@/lib/useSubscription';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

/** A location older than this is shown as stale rather than live. */
const STALE_MS = 2 * 60 * 1000;

function StatusBadge({ kind }: { kind: Child['kind'] }) {
  const { t } = useI18n();
  if (kind === 'board') return <Badge tone="success" icon="checkmark" label={t('boarded')} />;
  if (kind === 'alight') return <Badge tone="brand" icon="arrow-forward" label={t('gotOff')} />;
  return <Badge tone="neutral" icon="ellipse-outline" label={t('notBoarded')} />;
}

export default function ParentHome() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const { active, loading: subLoading } = useSubscription();
  const { children, selected, select, route, stops, bus, refreshing, failed, refresh } = useParentData(active);
  // Ticks so a bus that stops reporting turns "stale" on screen without any other update.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const myStop = stops.find((s) => s.id === selected?.student.stop_id) ?? null;
  const busAge = bus ? now - new Date(bus.updated_at).getTime() : Infinity;
  const live = busAge < STALE_MS;

  // How many stops until the bus reaches this child's stop (only while it's still ahead).
  const stopsAway = useMemo(() => {
    if (!bus || !myStop || stops.length === 0) return null;
    const diff = myStop.seq - stops[nearestStopIndex(bus, stops)].seq;
    return diff > 0 ? diff : null;
  }, [bus, myStop, stops]);

  if (subLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }
  if (!active) return <PaywallNotice title={t('todayRide')} />;

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('todayRide')} subtitle={`${t('hello')}, ${firstName}`} />

      <View style={styles.mapWrap}>
        <RouteMap route={route} stops={stops} bus={live ? bus : null} myStopId={myStop?.id} bottomInset={230} />

        <View style={styles.sheet}>
          {children.length === 0 || !selected ? (
            <Empty text={failed ? t('loadFailed') : t('noChildren')} />
          ) : (
            <ScrollView
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
              contentContainerStyle={{ gap: spacing.md }}
            >
              {children.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                  {children.map((c) => {
                    const on = c.student.id === selected.student.id;
                    return (
                      <Pressable
                        key={c.student.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => select(c.student.id)}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, on && { color: colors.onBrand }]}>
                          {c.student.full_name.split(' ')[0]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.childRow}>
                <Avatar name={selected.student.full_name} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{selected.student.full_name}</Text>
                  <Text style={styles.muted}>
                    {selected.vehicle?.reg_number ?? ''}
                    {myStop ? ` · ${t('yourStop')}: ${myStop.name}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <StatusBadge kind={selected.kind} />
                {selected.at && (
                  <Text style={styles.muted}>{new Date(selected.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</Text>
                )}
              </View>

              <View style={styles.busLine}>
                <View style={[styles.dot, { backgroundColor: live ? colors.success : colors.border }]} />
                <Text style={styles.busText}>
                  {live
                    ? `${t('busOnWay')}${stopsAway ? ` · ${stopsAway} ${t('stopsAway')}` : ''}`
                    : bus
                      ? `${t('lastSeen')} ${new Date(bus.updated_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
                      : t('busNotStarted')}
                </Text>
              </View>

              <Button
                title={t('openChild')}
                variant="secondary"
                onPress={() => router.push({ pathname: '/child/[id]', params: { id: selected.student.id } })}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  mapWrap: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '58%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingTop: spacing.lg,
    ...shadow,
    shadowOffset: { width: 0, height: -4 },
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.brand },
  chipText: { ...fonts.bodySemi, fontSize: 15, color: colors.ink },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...fonts.display, fontSize: 20, color: colors.ink },
  muted: { ...fonts.body, fontSize: 14, color: colors.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  busLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  busText: { ...fonts.bodySemi, fontSize: 16, color: colors.ink, flex: 1 },
});
