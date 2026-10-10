import * as Location from 'expo-location';
import { supabase } from './supabase';

/** Don't write more often than this; keeps Realtime traffic and battery use low. */
const MIN_INTERVAL_MS = 5000;

let subscription: Location.LocationSubscription | null = null;
let lastSent = 0;

/**
 * Driver side: while a trip is open, report this phone's position.
 * Foreground only for now: the app must stay open (the trip screen keeps the screen awake).
 */
export async function startSharing(vehicleId: string, tripId: string): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return false;
  await stopSharingWatch();

  subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: MIN_INTERVAL_MS },
    (pos) => {
      const now = Date.now();
      if (now - lastSent < MIN_INTERVAL_MS) return;
      lastSent = now;
      void supabase.from('bus_locations').upsert({
        vehicle_id: vehicleId,
        trip_id: tripId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        updated_at: new Date().toISOString(),
      });
    },
  );
  return true;
}

async function stopSharingWatch() {
  subscription?.remove();
  subscription = null;
  lastSent = 0;
}

export async function stopSharing(vehicleId: string) {
  await stopSharingWatch();
  await supabase.from('bus_locations').delete().eq('vehicle_id', vehicleId);
}
