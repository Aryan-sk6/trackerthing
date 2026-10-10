export type Role = 'driver' | 'parent';
export type TripKind = 'morning' | 'evening';
export type ScanKind = 'board' | 'alight';

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  language: 'te' | 'en';
  notify_board: boolean;
  notify_alight: boolean;
}

export interface Student {
  id: string;
  full_name: string;
  school_name: string;
  class_name: string | null;
  card_code: string;
  vehicle_id: string | null;
  stop_id: string | null;
}

export interface Vehicle {
  id: string;
  reg_number: string;
  school_name: string;
  district: string | null;
  driver_name: string | null;
  driver_phone: string | null;
}

export interface RouteStop {
  id: string;
  route_id: string;
  seq: number;
  name: string;
  lat: number;
  lng: number;
  scheduled_time: string | null;
}

export interface BusRoute {
  id: string;
  vehicle_id: string;
  name: string;
  path: [number, number][];
}

export interface BusLocation {
  vehicle_id: string;
  trip_id: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  updated_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  kind: TripKind;
  started_at: string;
  ended_at: string | null;
}

export interface ScanEvent {
  id: string;
  trip_id: string;
  student_id: string;
  kind: ScanKind;
  scanned_at: string;
  students?: Pick<Student, 'full_name' | 'school_name'>;
}

export interface ScanResult {
  student_id: string;
  student_name: string;
  kind: ScanKind;
  scanned_at: string;
}

export interface Subscription {
  parent_id: string;
  status: 'active' | 'expired' | 'none';
  expires_at: string | null;
  product_id: string | null;
}
