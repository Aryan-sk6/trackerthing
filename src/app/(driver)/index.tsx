import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ScanResult, Trip, TripKind } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

/** Ignore the same card for this long so one tap doesn't toggle board/alight twice. */
const RESCAN_COOLDOWN_MS = 4000;

export default function DriverTrip() {
  const { signOut } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const recent = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    const { data: vehicle } = await supabase.from('vehicles').select('id').maybeSingle();
    setVehicleId(vehicle?.id ?? null);
    const { data: open } = await supabase
      .from('trips')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setTrip((open as Trip | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startTrip(kind: TripKind) {
    if (!vehicleId) return Alert.alert('No vehicle', 'Ask your school admin to assign a vehicle.');
    setBusy(true);
    const { data, error: err } = await supabase
      .from('trips')
      .insert({ vehicle_id: vehicleId, kind })
      .select()
      .single();
    setBusy(false);
    if (err) Alert.alert('Could not start trip', err.message);
    else setTrip(data as Trip);
  }

  async function endTrip() {
    if (!trip) return;
    setBusy(true);
    const { error: err } = await supabase
      .from('trips')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', trip.id);
    setBusy(false);
    if (err) return Alert.alert('Could not end trip', err.message);
    setTrip(null);
    setLast(null);
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
    setError(null);
    setLast((rows as ScanResult[])[0]);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  if (loading) return null;

  if (!trip) {
    return (
      <View style={styles.container}>
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.heading}>Start a trip</Text>
          <Text style={styles.muted}>
            Parents are alerted the moment you scan their child's ID card.
          </Text>
          <Button title="Morning pickup" loading={busy} onPress={() => startTrip('morning')} />
          <Button title="Evening drop" variant="secondary" loading={busy} onPress={() => startTrip('evening')} />
        </Card>
        <Button title="Sign out" variant="secondary" onPress={signOut} />
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.heading}>Camera access needed</Text>
          <Text style={styles.muted}>Allow the camera to scan student ID cards.</Text>
          <Button title="Allow camera" onPress={requestPermission} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
          onBarcodeScanned={onScan}
        />
      </View>
      <Card>
        {error ? (
          <Text style={[styles.result, { color: colors.danger }]}>{error}</Text>
        ) : last ? (
          <>
            <Text style={[styles.result, { color: last.kind === 'board' ? colors.success : colors.info }]}>
              {last.kind === 'board' ? 'Boarded' : 'Got off'}: {last.student_name}
            </Text>
            <Text style={styles.muted}>{new Date(last.scanned_at).toLocaleTimeString()}</Text>
          </>
        ) : (
          <Text style={styles.muted}>Hold a student ID card in front of the camera…</Text>
        )}
      </Card>
      <Button title="End trip" variant="danger" loading={busy} onPress={endTrip} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.bg },
  cameraWrap: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
  result: { fontSize: 18, fontWeight: '700' },
});
