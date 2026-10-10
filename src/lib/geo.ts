/** Great-circle distance in metres. */
export function distanceM(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Index of the stop closest to the bus. */
export function nearestStopIndex(
  bus: { lat: number; lng: number },
  stops: { lat: number; lng: number }[],
): number {
  let best = 0;
  let bestD = Infinity;
  stops.forEach((s, i) => {
    const d = distanceM([bus.lat, bus.lng], [s.lat, s.lng]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
