/**
 * Sample data for demo mode ("Try the demo"), so the app can be explored, and reviewed by
 * app stores, without a backend account. Nothing here is real: names are invented and the
 * phone number is in a range reserved for fiction.
 */
import type { BusLocation, BusRoute, RouteStop, ScanEvent, Student, Vehicle } from './types';

export const DEMO_VEHICLE_ID = 'demo-vehicle-1';
export const DEMO_STUDENT_ID = 'demo-student-1';

export const DEMO_ROUTE: BusRoute = {
  id: 'demo-route-1',
  vehicle_id: DEMO_VEHICLE_ID,
  name: 'Route 4: Park Gate to Greenwood School',
  path: [
    [37.7726, -122.466],
    [37.7735, -122.4545],
    [37.7745, -122.442],
    [37.776, -122.43],
    [37.7775, -122.419],
  ],
};

export const DEMO_STOPS: RouteStop[] = [
  { id: 'stop-1', route_id: 'demo-route-1', seq: 1, name: 'Park Gate', lat: 37.7726, lng: -122.466, scheduled_time: '07:45' },
  { id: 'stop-2', route_id: 'demo-route-1', seq: 2, name: 'Library Corner', lat: 37.7735, lng: -122.4545, scheduled_time: '07:55' },
  { id: 'stop-3', route_id: 'demo-route-1', seq: 3, name: 'Market Square', lat: 37.7745, lng: -122.442, scheduled_time: '08:05' },
  { id: 'stop-4', route_id: 'demo-route-1', seq: 4, name: 'Elm Street', lat: 37.776, lng: -122.43, scheduled_time: '08:15' },
  { id: 'stop-5', route_id: 'demo-route-1', seq: 5, name: 'Greenwood School', lat: 37.7775, lng: -122.419, scheduled_time: '08:25' },
];

export function demoBus(): BusLocation {
  return {
    vehicle_id: DEMO_VEHICLE_ID,
    trip_id: 'demo-trip-1',
    lat: 37.7738,
    lng: -122.45,
    heading: 80,
    speed: 8,
    updated_at: new Date().toISOString(),
  };
}

export const DEMO_STUDENT: Student = {
  id: DEMO_STUDENT_ID,
  full_name: 'Alex Morgan',
  school_name: 'Greenwood School',
  class_name: 'Grade 4',
  card_code: 'GWS-4012',
  vehicle_id: DEMO_VEHICLE_ID,
  stop_id: 'stop-3',
};

export function demoVehicle(driverName: string | null = 'Sam Rivera'): Vehicle {
  return {
    id: DEMO_VEHICLE_ID,
    reg_number: 'BUS-042',
    school_name: 'Greenwood School',
    district: null,
    driver_name: driverName,
    driver_phone: '+12025550123',
    timezone: 'UTC',
  };
}

export function demoScanEvents(): ScanEvent[] {
  const who = { full_name: DEMO_STUDENT.full_name, school_name: DEMO_STUDENT.school_name };
  return [
    {
      id: 'demo-scan-1',
      student_id: DEMO_STUDENT_ID,
      trip_id: 'demo-trip-1',
      kind: 'board',
      scanned_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      students: who,
    },
    {
      id: 'demo-scan-2',
      student_id: DEMO_STUDENT_ID,
      trip_id: 'demo-trip-yesterday',
      kind: 'alight',
      scanned_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      students: who,
    },
  ];
}

/** Attendance for the past ten days, skipping weekends. Times are built in local time. */
export function demoAttendance() {
  const today = new Date();
  const days: { student_id: string; day: string; first_boarded: string; last_alighted: string }[] = [];
  for (let n = Math.max(1, today.getDate() - 10); n <= today.getDate(); n++) {
    const d = new Date(today.getFullYear(), today.getMonth(), n);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    days.push({
      student_id: DEMO_STUDENT_ID,
      day,
      first_boarded: new Date(d.getFullYear(), d.getMonth(), n, 8, 5).toISOString(),
      last_alighted: new Date(d.getFullYear(), d.getMonth(), n, 15, 45).toISOString(),
    });
  }
  return days;
}
