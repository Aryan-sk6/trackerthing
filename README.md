# SchoolRide

Open-source school bus tracker built with Expo (React Native, SDK 57) and Supabase.

- **Drivers** (free) start a morning or afternoon trip and scan student ID cards (QR or barcode) with the phone camera. Each scan toggles *boarded* / *got off*.
- **Parents** (optional in-app subscription) get a push alert when their child's card is scanned, see the bus on a map with the route and stops, and view attendance and a travel log.
- The bus position comes from the **driver's phone** during a trip, so no GPS hardware is needed.
- **Demo mode** ("Try the demo") shows sample data with no backend, which is useful for evaluation and app review.

## Stack
Expo Router, TypeScript, Supabase (phone OTP auth, Postgres + RLS, Realtime, Edge Functions), RevenueCat, Expo Notifications, expo-camera, react-native-maps.

## Setup
1. `npm ci`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor. Enable Phone auth with an SMS provider that covers your country (Twilio, MessageBird, Vonage…).
3. `cp .env.example .env` and fill it in (Supabase, RevenueCat, default dial code, privacy/terms/support links, bundle id, EAS project id, Android Google Maps key).
4. Deploy the edge functions: `supabase functions deploy notify-parents revenuecat-webhook delete-account`, and set the secrets `WEBHOOK_SECRET` and `REVENUECAT_WEBHOOK_SECRET`.
   - Database Webhook: `scan_events` INSERT → `notify-parents`, header `Authorization: Bearer <WEBHOOK_SECRET>`.
   - RevenueCat webhook → `revenuecat-webhook`. Create the entitlement `parent_access` and an offering.
5. Push notifications and purchases need a **development build**, not Expo Go: `npx eas-cli build --profile development`, then `npx expo start --dev-client`.

## Data onboarding
Vehicles, routes, students and drivers are managed by the school or operator in the Supabase dashboard (there is no admin UI yet). Set `vehicles.timezone` to the school's IANA zone (for example `Europe/London`), `students.card_code` to the value printed on the ID card, and `students.parent_phone` to the parent's number in **E.164** format (`+447700900123`). A parent who signs up with that number is linked to the child automatically. See `supabase/seed.sql`.

## Translations
English is the base language. To add a language, add a dictionary in `src/lib/i18n.tsx` and register it there; the language picker appears automatically. Dates and times follow the device locale.

## Development
`npm run typecheck`, `npm run lint`, `npm run doctor`.

## Roadmap: contributions welcome
SchoolRide works end to end, but these are open for anyone who forks or contributes:

- **Branding**: app icon, splash image and store screenshots are still Expo placeholders (`assets/`). Change `BrandMark` in `src/components/ui.tsx` and the tokens in `src/theme`.
- **Admin dashboard** for schools to manage vehicles, routes, students and cards (today: Supabase dashboard / SQL).
- **Background location** for drivers (today the trip screen must stay open).
- **Offline mode**: queue scans when the driver has no signal and sync later.
- **Error states**: most lists show an empty state on network failure; parent Home shows a retry message.
- **Dark mode** and Dynamic Type testing at the largest sizes.
- **Translations**: UI strings and the push alert text (`supabase/functions/notify-parents`) are English only.
- **Tests**: there are none yet; `record_scan` and the RLS policies are the most valuable to cover.
- **Database migrations**: `schema.sql` is a single bootstrap file; move it to `supabase/migrations` before changing a live project.

## License
MIT. See [LICENSE](LICENSE).
