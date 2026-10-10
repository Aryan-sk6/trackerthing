-- SchoolRide schema. Run in the Supabase SQL editor (or as a migration).
-- Admin data (vehicles, students) is managed by the school/operator via the
-- dashboard or service role; the app itself never creates it.

create extension if not exists pgcrypto;

-- ───────────── Tables ─────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('driver', 'parent')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles on delete set null,
  reg_number text not null unique,        -- e.g. TS09UB1234
  school_name text not null,
  district text                           -- Telangana district
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  school_name text not null,
  class_name text,
  card_code text not null unique,         -- value encoded in the ID card QR/barcode
  vehicle_id uuid references public.vehicles on delete set null,
  parent_phone text                       -- used to auto-link a parent on sign-up
);

create table public.parent_students (
  parent_id uuid references public.profiles on delete cascade,
  student_id uuid references public.students on delete cascade,
  primary key (parent_id, student_id)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles,
  driver_id uuid not null references public.profiles default auth.uid(),
  kind text not null check (kind in ('morning', 'evening')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index one_open_trip_per_vehicle on public.trips (vehicle_id) where ended_at is null;

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  student_id uuid not null references public.students,
  kind text not null check (kind in ('board', 'alight')),
  scanned_at timestamptz not null default now()
);
create index scan_events_student_time on public.scan_events (student_id, scanned_at desc);

create table public.push_tokens (
  user_id uuid references public.profiles on delete cascade,
  token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- Written only by the RevenueCat webhook (service role).
create table public.subscriptions (
  parent_id uuid primary key references public.profiles on delete cascade,
  status text not null default 'none' check (status in ('active', 'expired', 'none')),
  expires_at timestamptz,
  product_id text,
  updated_at timestamptz not null default now()
);

-- Daily attendance: a student is present on a day if they boarded at least once.
create view public.attendance_daily with (security_invoker = true) as
select
  se.student_id,
  (se.scanned_at at time zone 'Asia/Kolkata')::date as day,
  min(se.scanned_at) filter (where se.kind = 'board')  as first_boarded,
  max(se.scanned_at) filter (where se.kind = 'alight') as last_alighted
from public.scan_events se
group by 1, 2
having count(*) filter (where se.kind = 'board') > 0;

-- ───────────── Helpers ─────────────

create function public.is_subscribed(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where parent_id = uid and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

-- Link a new parent to the students registered with their phone number.
create function public.link_parent_students() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'parent' and new.phone is not null then
    insert into public.parent_students (parent_id, student_id)
    select new.id, s.id from public.students s
    where right(regexp_replace(s.parent_phone, '\D', '', 'g'), 10)
        = right(regexp_replace(new.phone, '\D', '', 'g'), 10)
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger profiles_link_students
after insert on public.profiles
for each row execute function public.link_parent_students();

-- Scan a card: toggles board/alight for that student within the trip.
create function public.record_scan(p_trip_id uuid, p_card_code text)
returns table (student_id uuid, student_name text, kind text, scanned_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_trip public.trips;
  v_student public.students;
  v_last text;
  v_kind text;
  v_event public.scan_events;
begin
  select * into v_trip from public.trips
   where id = p_trip_id and driver_id = auth.uid() and ended_at is null;
  if not found then raise exception 'Trip is not active'; end if;

  select * into v_student from public.students where card_code = p_card_code;
  if not found then raise exception 'Unknown ID card'; end if;
  if v_student.vehicle_id is distinct from v_trip.vehicle_id then
    raise exception '% is not assigned to this vehicle', v_student.full_name;
  end if;

  select se.kind into v_last from public.scan_events se
   where se.trip_id = p_trip_id and se.student_id = v_student.id
   order by se.scanned_at desc limit 1;
  v_kind := case when v_last = 'board' then 'alight' else 'board' end;

  insert into public.scan_events (trip_id, student_id, kind)
  values (p_trip_id, v_student.id, v_kind) returning * into v_event;

  return query select v_student.id, v_student.full_name, v_event.kind, v_event.scanned_at;
end $$;

-- ───────────── Row level security ─────────────

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.students enable row level security;
alter table public.parent_students enable row level security;
alter table public.trips enable row level security;
alter table public.scan_events enable row level security;
alter table public.push_tokens enable row level security;
alter table public.subscriptions enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "driver sees own vehicle" on public.vehicles for select using (driver_id = auth.uid());

create policy "driver sees route students" on public.students for select using (
  vehicle_id in (select id from public.vehicles where driver_id = auth.uid())
);
create policy "parent sees own children" on public.students for select using (
  id in (select student_id from public.parent_students where parent_id = auth.uid())
);

create policy "parent sees own links" on public.parent_students for select using (parent_id = auth.uid());

create policy "driver trips read" on public.trips for select using (driver_id = auth.uid());
create policy "driver trips start" on public.trips for insert with check (
  driver_id = auth.uid()
  and vehicle_id in (select id from public.vehicles where driver_id = auth.uid())
);
create policy "driver trips end" on public.trips for update using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

-- No insert policy on scan_events: rows are created only through record_scan().
create policy "driver reads own scans" on public.scan_events for select using (
  trip_id in (select id from public.trips where driver_id = auth.uid())
);
create policy "subscribed parent reads child scans" on public.scan_events for select using (
  public.is_subscribed(auth.uid())
  and student_id in (select student_id from public.parent_students where parent_id = auth.uid())
);

create policy "own push tokens" on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own subscription read" on public.subscriptions for select using (parent_id = auth.uid());

grant execute on function public.record_scan(uuid, text) to authenticated;

-- Realtime for the parent "Today" screen (respects RLS).
alter publication supabase_realtime add table public.scan_events;
