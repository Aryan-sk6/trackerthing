import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';
import type { BusLocation, BusRoute, RouteStop } from '@/lib/types';
import { colors, fonts } from '@/theme';

/** Hyderabad, used until a route is loaded. */
const FALLBACK = { latitude: 17.385, longitude: 78.4867, latitudeDelta: 0.2, longitudeDelta: 0.2 };

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
      accessibilityLabel="Bus route map"
    >
      {path.length > 1 && (
        <>
          {/* White casing under the indigo line keeps the route readable on any map style. */}
          <Polyline coordinates={path} strokeColor="#fff" strokeWidth={9} />
          <Polyline coordinates={path} strokeColor={colors.indigo} strokeWidth={5} />
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
                <Ionicons name="home" size={14} color={colors.ink} />
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
    borderColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMine: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderColor: colors.indigo,
  },
  stopNum: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.indigo },
  bus: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
