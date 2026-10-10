import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type {
  BusLocation,
  BusRoute,
  RouteStop,
  ScanKind,
  Student,
  Vehicle,
} from './types';

export interface Child {
  student: Student;
  vehicle: Vehicle | null;
  kind: ScanKind | null;
  at: string | null;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Everything the parent Home screen needs: children with today's status, the selected
 * child's route and stops, and the live bus position. Realtime keeps it fresh;
 * RLS hides route/scan/location rows from non-subscribers.
 */
export function useParentData(enabled: boolean) {
  const { session } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<BusRoute | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [bus, setBus] = useState<BusLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const selected = useMemo(
    () => children.find((c) => c.student.id === selectedId) ?? children[0] ?? null,
    [children, selectedId],
  );
  const vehicleId = selected?.student.vehicle_id ?? null;

  const loadChildren = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    const { data: links } = await supabase
      .from('parent_students')
      .select('students(*, vehicles(*))')
      .eq('parent_id', session.user.id);
    const rows = (links ?? []).flatMap((l: any) => (l.students ? [l.students] : []));

    const { data: events } = await supabase
      .from('scan_events')
      .select('student_id, kind, scanned_at')
      .gte('scanned_at', startOfToday())
      .order('scanned_at', { ascending: false });
    const latest = new Map<string, { kind: ScanKind; at: string }>();
    for (const e of (events ?? []) as { student_id: string; kind: ScanKind; scanned_at: string }[]) {
      if (!latest.has(e.student_id)) latest.set(e.student_id, { kind: e.kind, at: e.scanned_at });
    }

    setChildren(
      rows.map((r: any) => {
        const { vehicles, ...student } = r;
        return {
          student: student as Student,
          vehicle: (vehicles as Vehicle | null) ?? null,
          kind: latest.get(student.id)?.kind ?? null,
          at: latest.get(student.id)?.at ?? null,
        };
      }),
    );
    setRefreshing(false);
  }, [session]);

  const loadRoute = useCallback(async () => {
    if (!vehicleId) {
      setRoute(null);
      setStops([]);
      setBus(null);
      return;
    }
    const { data: r } = await supabase.from('routes').select('*').eq('vehicle_id', vehicleId).maybeSingle();
    setRoute((r as BusRoute | null) ?? null);
    if (r) {
      const { data: s } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', r.id)
        .order('seq');
      setStops((s as RouteStop[]) ?? []);
    } else {
      setStops([]);
    }
    const { data: b } = await supabase
      .from('bus_locations')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .maybeSingle();
    setBus((b as BusLocation | null) ?? null);
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) void loadChildren();
    }, [enabled, loadChildren]),
  );

  useEffect(() => {
    if (enabled) void loadRoute();
  }, [enabled, loadRoute]);

  // Live: card scans refresh status; bus_locations move the marker.
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`parent-live-${vehicleId ?? 'none'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_events' }, () => {
        void loadChildren();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bus_locations' },
        (payload) => {
          if (payload.eventType === 'DELETE') return setBus(null);
          const row = payload.new as BusLocation;
          if (row.vehicle_id === vehicleId) setBus(row);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, vehicleId, loadChildren]);

  return {
    children,
    selected,
    select: setSelectedId,
    route,
    stops,
    bus,
    refreshing,
    refresh: loadChildren,
  };
}
