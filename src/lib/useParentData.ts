import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isGuest, useAuth } from './auth';
import { DEMO_ROUTE, DEMO_STOPS, DEMO_STUDENT, demoBus, demoVehicle } from './demo';
import { supabase } from './supabase';
import type {
  BusLocation,
  BusRoute,
  RouteStop,
  ScanKind,
  Student,
  Vehicle,
} from './types';

/** Shape of `parent_students.select('students(*, vehicles(*))')`. */
type LinkRow = { students: (Student & { vehicles: Vehicle | null }) | null };

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

function demoChildren(): Child[] {
  return [
    {
      student: DEMO_STUDENT,
      vehicle: demoVehicle(),
      kind: 'board',
      at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ];
}

interface RouteData {
  vehicleId: string;
  route: BusRoute | null;
  stops: RouteStop[];
}

/**
 * Everything the parent Home screen needs: children with today's status, the selected
 * child's route and stops, and the live bus position. Realtime keeps it fresh;
 * RLS hides route/scan/location rows from non-subscribers. Demo mode returns sample data.
 */
export function useParentData(enabled: boolean) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const demo = isGuest(userId);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [bus, setBus] = useState<BusLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  // Demo values are created once per mount so timestamps stay put between renders.
  const [demoData] = useState(() => ({ children: demoChildren(), bus: demoBus() }));

  const list = demo ? demoData.children : children;
  const selected = useMemo(
    () => list.find((c) => c.student.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  );
  const vehicleId = demo ? null : (selected?.student.vehicle_id ?? null);

  const loadChildren = useCallback(async () => {
    if (!userId || isGuest(userId)) return;
    setRefreshing(true);
    const [{ data: links, error: linkError }, { data: events, error: eventError }] = await Promise.all([
      supabase.from('parent_students').select('students(*, vehicles(*))').eq('parent_id', userId),
      supabase
        .from('scan_events')
        .select('student_id, kind, scanned_at')
        .gte('scanned_at', startOfToday())
        .order('scanned_at', { ascending: false }),
    ]);
    setRefreshing(false);
    if (linkError || eventError) {
      // Keep whatever was on screen; the UI shows a "could not load" line instead of an empty state.
      setFailed(true);
      return;
    }
    setFailed(false);

    const latest = new Map<string, { kind: ScanKind; at: string }>();
    for (const e of (events ?? []) as { student_id: string; kind: ScanKind; scanned_at: string }[]) {
      if (!latest.has(e.student_id)) latest.set(e.student_id, { kind: e.kind, at: e.scanned_at });
    }
    const rows = ((links ?? []) as unknown as LinkRow[]).flatMap((l) => (l.students ? [l.students] : []));
    setChildren(
      rows.map((r) => {
        const { vehicles, ...student } = r;
        return {
          student,
          vehicle: vehicles ?? null,
          kind: latest.get(student.id)?.kind ?? null,
          at: latest.get(student.id)?.at ?? null,
        };
      }),
    );
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) void loadChildren();
    }, [enabled, loadChildren]),
  );

  useEffect(() => {
    if (!enabled || !vehicleId) return;
    let cancelled = false;
    void (async () => {
      const { data: r } = await supabase.from('routes').select('*').eq('vehicle_id', vehicleId).maybeSingle();
      const { data: s } = r
        ? await supabase.from('route_stops').select('*').eq('route_id', r.id).order('seq')
        : { data: [] };
      const { data: b } = await supabase.from('bus_locations').select('*').eq('vehicle_id', vehicleId).maybeSingle();
      if (cancelled) return;
      setRouteData({ vehicleId, route: (r as BusRoute | null) ?? null, stops: (s as RouteStop[]) ?? [] });
      setBus((b as BusLocation | null) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, vehicleId]);

  // Live: card scans refresh status; bus_locations move the marker.
  // DELETE events skip RLS and reach every subscriber with only the primary key, so each
  // event is checked against this child's vehicle before it touches the marker.
  useEffect(() => {
    if (!enabled || demo) return;
    let channel = supabase
      .channel(`parent-live-${vehicleId ?? 'none'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_events' }, () => {
        void loadChildren();
      });
    if (vehicleId) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bus_locations', filter: `vehicle_id=eq.${vehicleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if ((payload.old as Partial<BusLocation>).vehicle_id === vehicleId) setBus(null);
            return;
          }
          const row = payload.new as BusLocation;
          if (row.vehicle_id === vehicleId) setBus(row);
        },
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, demo, vehicleId, loadChildren]);

  // Only show route data that belongs to the currently selected child's vehicle.
  const current = routeData && routeData.vehicleId === vehicleId ? routeData : null;
  const currentBus = bus && bus.vehicle_id === vehicleId ? bus : null;

  return {
    children: list,
    selected,
    select: setSelectedId,
    route: demo ? DEMO_ROUTE : (current?.route ?? null),
    stops: demo ? DEMO_STOPS : (current?.stops ?? []),
    bus: demo ? demoData.bus : currentBus,
    refreshing,
    failed,
    refresh: loadChildren,
  };
}
