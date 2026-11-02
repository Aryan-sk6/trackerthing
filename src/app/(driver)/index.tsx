import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, ScreenHeader, Segmented } from '@/components/ui';
import { useI18n } from '@/lib/i18n';
import { startSharing, stopSharing } from '@/lib/locationSharing';
import { getShareLocation } from '@/lib/prefs';
import { supabase } from '@/lib/supabase';
import type { ScanKind, ScanResult, Trip, TripKind } from '@/lib/types';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

/** Ignore the same card for this long so one tap doesn't toggle board/alight twice. */
const RESCAN_COOLDOWN_MS = 4000;
const KEEP_AWAKE_TAG = 'trip';

export default function DriverTrip() {
  const { t, locale } = useI18n();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [status, setStatus] = useState<Map<string, ScanKind>>(new Map());
  const [kind, setKind] = useState<TripKind>(new Date().getHours() < 12 ? 'morning' : 'evening');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const recent = useRef(new Map<string, number>());

  const loadTripState = useCallback(async (tripId: string) => {
    const { data } = await supabase
      .from('scan_events')
      .select('student_id, kind')
      .eq('trip_id', tripId)
      .order('scanned_at');
    const m = new Map<string, ScanKind>();
    for (const e of (data ?? []) as { student_id: string; kind: ScanKind }[]) m.set(e.student_id, e.kind);
    setStatus(m);
  }, []);

  const beginSharing = useCallback(async (vId: string, tripId: string) => {
    if (!(await getShareLocation())) return setSharing(false);
    setSharing(await startSharing(vId, tripId));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: vehicle } = await supabase.from('vehicles').select('id').maybeSingle();
      const { count } = await supabase.from('students').select('id', { count: 'exact', head: true });
      const { data: open } = await supabase
        .from('trips')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const current = (open as Trip | null) ?? null;
      setVehicleId(vehicle?.id ?? null);
      setStudentCount(count ?? 0);
      setTrip(current);
      // Resume an open trip (app was killed mid-route): reload who is on board and restart sharing.
      if (current && vehicle) {
        await loadTripState(current.id);
        await beginSharing(vehicle.id, current.id);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTripState, beginSharing]);

  // Keep the phone awake while a trip is open so location keeps flowing to parents.
  useEffect(() => {
    if (!trip) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [trip]);

  async function startTrip() {
    if (!vehicleId) return Alert.alert(t('noVehicle'), t('noVehicleBody'));
    setBusy(true);
    const { data, error: err } = await supabase
      .from('trips')
      .insert({ vehicle_id: vehicleId, kind })
      .select()
      .single();
    setBusy(false);
    if (err) return Alert.alert(t('errorTitle'), err.message);
    setTrip(data as Trip);
    setStatus(new Map());
    await beginSharing(vehicleId, (data as Trip).id);
  }

  async function endTrip() {
    if (!trip) return;
    setBusy(true);
    const { error: err } = await supabase
      .from('trips')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', trip.id);
    if (vehicleId) await stopSharing(vehicleId);
    setBusy(false);
    if (err) return Alert.alert(t('errorTitle'), err.message);
    setTrip(null);
    setLast(null);
    setSharing(false);
  }

  async function onScan({ data }: BarcodeScanningResult) {
    if (!trip) return;
    const now = Date.now();
    if (now - (recent.current.get(data) ?? 0) < RESCAN_COOLDOWN_MS) return;
    recent.current.set(data, now);

    const { data: rows, error: err } = await supabase.rpc('record_scan', {
      p_trip_id: trip.id,
      p_card_code: data,
    });
    if (err) {
      setError(err.message);
      setLast(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const result = (rows as ScanResult[])[0];
    setError(null);
    setLast(result);
    setStatus((prev) => new Map(prev).set(result.student_id, result.kind));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('startTrip')} showCrest />
        <View style={styles.body}>
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.text}>{t('startTripBody')}</Text>
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'morning', label: t('morningPickup') },
                { value: 'evening', label: t('eveningDrop') },
              ]}
            />
            <Button title={t('startTrip')} loading={busy} onPress={startTrip} />
          </Card>
          {!vehicleId && <Text style={styles.warn}>{t('noVehicleBody')}</Text>}
        </View>
      </View>
    );
  }

  const onBoard = [...status.values()].filter((k) => k === 'board').length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={trip.kind === 'morning' ? t('morningPickup') : t('eveningDrop')}
        subtitle={sharing ? t('sharingLocation') : undefined}
      />
      <View style={styles.body}>
        {!permission?.granted ? (
          <Card style={{ gap: spacing.md }}>
            {/* Neutral "Continue": the real decision happens in the system prompt. Once the
                user has said no for good, the only way back is the Settings app. */}
            <Text style={styles.heading}>
              {permission && !permission.canAskAgain ? t('cameraBlocked') : t('cameraNeeded')}
            </Text>
            {permission && !permission.canAskAgain ? (
              <Button title={t('openSettings')} onPress={() => void Linking.openSettings()} />
            ) : (
              <Button title={t('continue')} onPress={requestPermission} />
            )}
          </Card>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
              onBarcodeScanned={onScan}
            />
            <View pointerEvents="none" style={styles.frame}>
              {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
                <View key={c} style={[styles.corner, cornerStyles[c]]} />
              ))}
            </View>
            <Text style={styles.cameraHint}>{t('keepCardInFrame')}</Text>
          </View>
        )}

        <View
          style={[
            styles.result,
            { backgroundColor: error ? colors.danger : last?.kind === 'alight' ? colors.brand : last ? colors.success : colors.card },
            !error && !last && shadow,
          ]}
        >
          {error ? (
            <>
              <Ionicons name="alert-circle" size={32} color="#fff" />
              <Text style={[styles.resultText, { color: '#fff' }]}>{error}</Text>
            </>
          ) : last ? (
            <>
              <Ionicons name={last.kind === 'board' ? 'checkmark-circle' : 'exit'} size={32} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultText, { color: '#fff' }]}>{last.student_name}</Text>
                <Text style={styles.resultSub}>
                  {last.kind === 'board' ? t('boarded') : t('gotOff')} · {new Date(last.scanned_at).toLocaleTimeString(locale, { timeStyle: 'short' })}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.text, { flex: 1 }]}>{t('keepCardInFrame')}…</Text>
          )}
        </View>

        <View style={styles.counter}>
          <Badge tone="success" icon="people" label={`${t('onBoardCount')} ${onBoard} / ${studentCount}`} />
        </View>
        <Button title={t('endTrip')} variant="danger" loading={busy} onPress={endTrip} />
      </View>
    </View>
  );
}

const CORNER = 44;
const cornerStyles = StyleSheet.create({
  tl: { left: 0, top: 0, borderLeftWidth: 5, borderTopWidth: 5, borderTopLeftRadius: 14 },
  tr: { right: 0, top: 0, borderRightWidth: 5, borderTopWidth: 5, borderTopRightRadius: 14 },
  bl: { left: 0, bottom: 0, borderLeftWidth: 5, borderBottomWidth: 5, borderBottomLeftRadius: 14 },
  br: { right: 0, bottom: 0, borderRightWidth: 5, borderBottomWidth: 5, borderBottomRightRadius: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing.md, gap: spacing.md },
  cameraWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: 220, height: 220 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  cameraHint: {
    position: 'absolute',
    bottom: 16,
    color: colors.onBrand,
    ...fonts.bodySemi,
    fontSize: 16,
  },
  heading: { ...fonts.display, fontSize: 20, color: colors.ink },
  text: { ...fonts.body, fontSize: 16, lineHeight: 24, color: colors.muted },
  warn: { ...fonts.bodyMedium, fontSize: 15, color: colors.danger },
  result: {
    minHeight: 72,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultText: { ...fonts.display, fontSize: 21, flexShrink: 1 },
  resultSub: { ...fonts.bodyMedium, fontSize: 14, color: '#fff' },
  counter: { flexDirection: 'row', justifyContent: 'center' },
});
