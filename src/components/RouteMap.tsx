import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';
import type { BusLocation, BusRoute, RouteStop } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { colors, fonts } from '@/theme';

/** Whole-world view until a route loads; the map then fits the route. */
const FALLBACK = { latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 };

export function RouteMap({
  route,
  stops,
  bus,
  myStopId,
  bottomInset = 0,
}: {
  route: BusRoute | null;
  stops: RouteStop[];
  bus: BusLocation | null;
  myStopId?: string | null;
  bottomInset?: number;
}) {
  const ref = useRef<MapView>(null);
  const { t } = useI18n();

  const path = useMemo<LatLng[]>(
    () => (route?.path ?? []).map(([latitude, longitude]) => ({ latitude, longitude })),
    [route],
  );

  // Fit the whole route (and the bus) in view whenever the data changes meaningfully.
  const fitKey = `${path.length}:${stops.length}:${bus ? 1 : 0}`;
  useEffect(() => {
    const points: LatLng[] = [
      ...path,
      ...stops.map((s) => ({ latitude: s.lat, longitude: s.lng })),
      ...(bus ? [{ latitude: bus.lat, longitude: bus.lng }] : []),
    ];
    if (points.length < 2) return;
    ref.current?.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 50, bottom: 60 + bottomInset, left: 50 },
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, bottomInset]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={FALLBACK}
      toolbarEnabled={false}
      showsCompass={false}
      accessibilityLabel={t('mapLabel')}
    >
      {path.length > 1 && (
        <>
          {/* White casing under the brand-coloured line keeps the route readable on any map style. */}
          <Polyline coordinates={path} strokeColor="#fff" strokeWidth={9} />
          <Polyline coordinates={path} strokeColor={colors.brand} strokeWidth={5} />
        </>
      )}

      {stops.map((s) => {
        const mine = s.id === myStopId;
        return (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            title={s.name}
            description={s.scheduled_time?.slice(0, 5)}
            tracksViewChanges={false}
          >
            <View style={[styles.stop, mine && styles.stopMine]}>
              {mine ? (
                <Ionicons name="home" size={15} color={colors.onBrand} />
              ) : (
                <Text style={styles.stopNum}>{s.seq}</Text>
              )}
            </View>
          </Marker>
        );
      })}

      {bus && (
        <Marker
          coordinate={{ latitude: bus.lat, longitude: bus.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={bus.heading ?? 0}
          zIndex={10}
        >
          <View style={styles.bus}>
            <Ionicons name="bus" size={24} color={colors.ink} />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  stop: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMine: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand,
    borderColor: colors.card,
  },
  stopNum: { ...fonts.bodyBold, fontSize: 12, color: colors.brand },
  bus: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bus,
    borderWidth: 3,
    borderColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
