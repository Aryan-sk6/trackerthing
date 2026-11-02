-- Sample data: one bus, a five-stop route and one student. Run after schema.sql, then:
--   1) sign up a driver in the app,
--   2) replace the driver uuid below with their profile id (Authentication → Users),
--   3) set parent_phone to the number a test parent will sign up with, in full international
--      format (E.164), then run this file. The parent is linked to the student on sign-up.
-- Names and the phone number are fictional (+1 202 555 01xx is reserved for fiction).
do $$
declare
  v_driver uuid := '00000000-0000-0000-0000-000000000001';  -- driver profile id
  v_vehicle uuid;
  v_route uuid;
  v_stop3 uuid;
begin
  insert into vehicles (driver_id, reg_number, school_name, district, driver_name, driver_phone, timezone)
  values (v_driver, 'BUS-042', 'Greenwood School', 'North depot', 'Sam Rivera', '+12025550123', 'America/Los_Angeles')
  returning id into v_vehicle;

  insert into routes (vehicle_id, name, path) values (v_vehicle, 'Route 4: Park Gate to Greenwood School',
    '[[37.7726,-122.4660],[37.7735,-122.4545],[37.7745,-122.4420],[37.7760,-122.4300],[37.7775,-122.4190]]')
  returning id into v_route;

  insert into route_stops (route_id, seq, name, lat, lng, scheduled_time) values
    (v_route, 1, 'Park Gate',        37.7726, -122.4660, '07:45'),
    (v_route, 2, 'Library Corner',   37.7735, -122.4545, '07:55'),
    (v_route, 3, 'Market Square',    37.7745, -122.4420, '08:05'),
    (v_route, 4, 'Elm Street',       37.7760, -122.4300, '08:15'),
    (v_route, 5, 'Greenwood School', 37.7775, -122.4190, '08:25');
  select id into v_stop3 from route_stops where route_id = v_route and seq = 3;

  insert into students (full_name, school_name, class_name, card_code, vehicle_id, stop_id, parent_phone)
  values ('Alex Morgan', 'Greenwood School', 'Grade 4', 'GWS-4012', v_vehicle, v_stop3, '+12025550188');
end $$;
