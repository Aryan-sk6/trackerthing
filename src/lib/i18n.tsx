import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * English is the base dictionary; every other language must provide the same keys
 * (TypeScript enforces this). To add a language:
 *   1. add `const xx: Dictionary = { ... }` below (or in its own file),
 *   2. register it in `dictionaries` with its native name in `languageNames`.
 * The language picker appears automatically once more than one language is registered.
 */
const en = {
  appName: 'SchoolRide',
  tagline: 'Know where the school bus is',
  welcomeTitle: 'Know the moment your child boards',
  welcomeBody: 'Drivers scan student ID cards; parents get an alert and see the bus on a map. Free for drivers.',
  getStarted: 'Get started',
  tryDemo: 'Try the demo',
  demoBanner: 'Demo mode: sample data, nothing is saved to a server.',
  mobileNumber: 'Mobile number',
  countryCode: 'Country code',
  phoneHint: 'Include your country code, e.g. +44 7700 900123.',
  sendOtp: 'Send code',
  enterOtp: '6-digit code',
  codeSentTo: 'Code sent to',
  changeNumber: 'Change number',
  verify: 'Verify & continue',
  backendMissing: 'Backend not configured. Copy .env.example to .env and add your Supabase keys, or try the demo.',
  whoAreYou: 'Who are you?',
  parent: 'Parent',
  driver: 'Driver',
  fullName: 'Full name',
  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',
  signOut: 'Sign out',
  driverFree: 'Drivers use SchoolRide free of charge.',
  parentHint: 'Subscribe to be alerted the moment your child boards.',
  // tabs
  tabTrip: 'Trip',
  tabStudents: 'Students',
  tabHistory: 'History',
  tabSettings: 'Settings',
  tabHome: 'Home',
  tabLog: 'Log',
  tabPlan: 'Plan',
  // driver trip
  startTrip: 'Start a trip',
  startTripBody: "Parents are alerted the moment you scan their child's ID card.",
  morningPickup: 'Morning pickup',
  eveningDrop: 'Afternoon drop-off',
  endTrip: 'End trip',
  keepCardInFrame: 'Hold the ID card in the frame',
  cameraNeeded: 'The camera is used to scan student ID cards.',
  cameraBlocked: 'Camera access is off. Turn it on in Settings to scan cards.',
  openSettings: 'Open Settings',
  boarded: 'On board',
  gotOff: 'Got off',
  notBoarded: 'Not boarded yet',
  onBoardCount: 'On board',
  noVehicle: 'No vehicle assigned',
  noVehicleBody: 'Ask your school admin to assign a vehicle.',
  sharingLocation: 'Sharing location',
  scans: 'scans',
  // parent home
  hello: 'Hello',
  todayRide: "Today's ride",
  busOnWay: 'Bus is on its way',
  busNotStarted: 'Bus has not started yet',
  lastSeen: 'Last seen',
  stopsAway: 'stops away',
  yourStop: 'Your stop',
  noChildren: 'No children linked to your account yet. Contact your school.',
  openChild: 'View details',
  scanNotGps: 'Position comes from the driver’s phone and ID card scans.',
  mapLabel: 'Bus route map',
  // paywall
  subscribeTitle: 'Get alerts the moment they board',
  perkAlerts: 'Instant alert when the ID card is scanned',
  perkMap: 'See where the bus is on the map',
  perkLog: 'Attendance and full travel log',
  subscribe: 'Subscribe',
  restore: 'Restore purchases',
  planActive: 'Subscription active',
  renews: 'Renews or ends on',
  noPlan: 'No active plan',
  perDay: 'per day',
  perWeek: 'per week',
  perMonth: 'per month',
  perYear: 'per year',
  everyNDays: 'every {n} days',
  everyNWeeks: 'every {n} weeks',
  everyNMonths: 'every {n} months',
  everyNYears: 'every {n} years',
  viewPlans: 'View plans',
  iapUnavailable: 'In-app purchases are unavailable in this build. Use a development build with RevenueCat keys configured.',
  autoRenewTerms:
    'Payment is charged to your app store account. The subscription renews automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel it in your store account settings.',
  terms: 'Terms of use',
  // settings
  settings: 'Settings',
  profile: 'Profile',
  language: 'Language',
  alerts: 'Alerts',
  alertBoard: 'When my child boards',
  alertAlight: 'When my child gets off',
  myChildren: 'My children',
  vehicle: 'Vehicle',
  locationSharing: 'Location sharing',
  locationSharingBody: "During a trip, your phone's location is visible to parents.",
  help: 'Help',
  privacy: 'Privacy policy',
  version: 'Version',
  account: 'Account',
  deleteAccount: 'Delete account',
  deleteAccountBody:
    'This permanently deletes your profile, alert settings and push tokens. Trip and attendance records kept by your school are not linked to you any more. This cannot be undone.',
  deleteConfirm: 'Delete',
  // history
  noRecords: 'No records yet.',
  attendance: 'Attendance',
  present: 'Present',
  absent: 'Absent',
  tripsThisMonth: 'Trips this month',
  firstBoarded: 'First boarded',
  lastAlighted: 'Last got off',
  errorTitle: 'Something went wrong',
  loadFailed: 'Could not load. Pull down to try again.',
  cancel: 'Cancel',
  save: 'Save',
};

export type TKey = keyof typeof en;
export type Dictionary = Record<TKey, string>;

const dictionaries = { en } satisfies Record<string, Dictionary>;
export type Lang = keyof typeof dictionaries;

/** Native names shown in the language picker. */
export const languageNames: Record<Lang, string> = { en: 'English' };
export const languages = Object.keys(dictionaries) as Lang[];

const STORAGE_KEY = 'schoolride.lang';

/** Device locale (e.g. "en-GB", "pt-BR"); used for date/time formatting in every language. */
export const deviceLocale: string = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    return 'en';
  }
})();

function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && v in dictionaries;
}

function defaultLang(): Lang {
  const base = deviceLocale.split('-')[0];
  return isLang(base) ? base : 'en';
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  /** BCP 47 locale for toLocale*String calls. */
  locale: string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => (isLang(v) ? setLangState(v) : undefined))
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => undefined);
  }, []);

  const value = useMemo<I18n>(() => {
    const dict: Dictionary = dictionaries[lang];
    // Keep the device's regional formats when its language matches; otherwise format in the chosen language.
    const locale = deviceLocale.split('-')[0] === lang ? deviceLocale : lang;
    return { lang, setLang, t: (key) => dict[key] ?? en[key], locale };
  }, [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
