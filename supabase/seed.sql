-- Demo data: a Warangal route with 5 stops. Run after schema.sql, then:
--   1) sign up a driver and a parent in the app,
--   2) replace the two uuids below with their profile ids (Auth → Users) and run this file.
do $$
declare
  v_driver uuid := '00000000-0000-0000-0000-000000000001';  -- driver profile id
  v_vehicle uuid;
  v_route uuid;
  v_stop3 uuid;
begin
  insert into vehicles (driver_id, reg_number, school_name, district, driver_name, driver_phone)
  values (v_driver, 'TS03 UB 1234', 'Kakatiya Public School', 'Hanamkonda', 'Ramesh', '+919848012345')
  returning id into v_vehicle;

  insert into routes (vehicle_id, name, path) values (v_vehicle, 'Hanamkonda → Kakatiya Public School',
    '[[18.0050,79.5580],[18.0023,79.5610],[17.9990,79.5660],[17.9962,79.5712],[17.9930,79.5760],[17.9885,79.5805]]')
  returning id into v_route;

  insert into route_stops (route_id, seq, name, lat, lng, scheduled_time) values
    (v_route, 1, 'Hanamkonda Bus Stand', 18.0050, 79.5580, '07:30'),
    (v_route, 2, 'Nakkalagutta', 18.0010, 79.5640, '07:38'),
    (v_route, 3, 'Subedari', 17.9962, 79.5712, '07:46'),
    (v_route, 4, 'Kazipet Road', 17.9930, 79.5760, '07:52'),
    (v_route, 5, 'Kakatiya Public School', 17.9885, 79.5805, '08:00');
  select id into v_stop3 from route_stops where route_id = v_route and seq = 3;

  -- parent_phone must match the parent's sign-up number to auto-link.
  insert into students (full_name, school_name, class_name, card_code, vehicle_id, stop_id, parent_phone)
  values ('Aarav Reddy', 'Kakatiya Public School', 'Class 5', 'STU-0001', v_vehicle, v_stop3, '9848012345');
end $$;
