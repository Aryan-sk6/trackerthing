export type Role = 'driver' | 'parent';
export type TripKind = 'morning' | 'evening';
export type ScanKind = 'board' | 'alight';

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
}

export interface Student {
  id: string;
  full_name: string;
  school_name: string;
  class_name: string | null;
  card_code: string;
  vehicle_id: string | null;
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
