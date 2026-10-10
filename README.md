# SchoolRide

Expo (React Native, SDK 57) app for private school transport in Telangana.

- **Drivers** (free): start a morning/evening trip, scan student ID cards (QR/barcode) with the camera. Each scan toggles *board* / *alight* and is logged against the trip.
- **Parents** (paid, in‑app subscription): get a push notification the moment their child's card is scanned, see live on‑board status, attendance and the travel log. Tracking is event-based (card scans) — **no GPS**.

## Stack
- Expo Router (`src/app`), TypeScript
- Supabase: phone OTP auth, Postgres + RLS, Realtime, Edge Functions
- RevenueCat (`react-native-purchases`) for App Store / Play subscriptions
- Expo Notifications (push), expo-camera (scanner)

## Setup
1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql`, enable Phone auth (needs an SMS provider; for India use a DLT-registered one such as Twilio/MSG91).
3. `cp .env.example .env` and fill in Supabase + RevenueCat keys.
4. Deploy the edge functions (`supabase functions deploy notify-parents revenuecat-webhook`) and set secrets `WEBHOOK_SECRET`, `REVENUECAT_WEBHOOK_SECRET`.
   - Database Webhook: `scan_events` INSERT → `notify-parents` (Authorization: `Bearer <WEBHOOK_SECRET>`).
   - RevenueCat webhook → `revenuecat-webhook`. Create entitlement `parent_access` and an offering with your subscription products.
5. Set the EAS project id in `app.json` (`npx eas-cli init`) — required for push tokens.
6. Subscriptions and push need a **development build**, not Expo Go: `npx eas-cli build --profile development --platform android`, then `npx expo start --dev-client`.

## Data onboarding
Vehicles, students and drivers are managed by the operator (Supabase dashboard / SQL). Set `students.card_code` to the value encoded on the ID card and `students.parent_phone`; when a parent signs up with that number, their children are linked automatically. Assign `vehicles.driver_id` to the driver's profile.

## Layout
```
src/app/(auth)     login (OTP) + role selection
src/app/(driver)   trip + scanner, students, history
src/app/(parent)   today (live), travel log, subscription
src/lib            supabase, auth, push, purchases
supabase/          schema.sql (tables, RLS, record_scan RPC), edge functions
```

## Before launch
- Store policies: Google Play/App Store require in-app billing for the parent subscription; a child-data privacy policy is needed (DPDP Act 2023: verifiable parental consent, data minimisation).
- Add an admin tool for schools to manage students/vehicles.
- Android/iOS camera + notification permission flows should be tested on real devices.
