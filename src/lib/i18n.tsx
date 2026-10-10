import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'te' | 'en';

const te = {
  appName: 'స్కూల్‌రైడ్',
  tagline: 'బడి బస్సు, భద్రంగా',
  welcomeTitle: 'మీ బిడ్డ భద్రత, క్షణాల్లో',
  welcomeBody: 'తెలంగాణ స్కూల్ బస్సుల కోసం. డ్రైవర్లకు ఉచితం.',
  getStarted: 'ప్రారంభించండి',
  mobileNumber: 'మొబైల్ నంబర్',
  sendOtp: 'OTP పంపండి',
  enterOtp: '6 అంకెల OTP',
  verify: 'ధృవీకరించి కొనసాగండి',
  whoAreYou: 'మీరు ఎవరు?',
  parent: 'తల్లిదండ్రులు',
  driver: 'డ్రైవర్',
  fullName: 'పూర్తి పేరు',
  continue: 'కొనసాగండి',
  signOut: 'సైన్ అవుట్',
  driverFree: 'డ్రైవర్లకు యాప్ ఉచితం.',
  parentHint: 'చందాతో బస్సు ఎక్కిన క్షణంలోనే సమాచారం.',
  // tabs
  tabTrip: 'ట్రిప్',
  tabStudents: 'విద్యార్థులు',
  tabHistory: 'చరిత్ర',
  tabSettings: 'సెట్టింగ్స్',
  tabHome: 'హోమ్',
  tabLog: 'లాగ్',
  tabPlan: 'ప్లాన్',
  // driver trip
  startTrip: 'ట్రిప్ ప్రారంభించండి',
  startTripBody: 'మీరు ID కార్డ్ స్కాన్ చేసిన క్షణమే తల్లిదండ్రులకు సమాచారం వెళ్తుంది.',
  morningPickup: 'ఉదయం పికప్',
  eveningDrop: 'సాయంత్రం డ్రాప్',
  endTrip: 'ట్రిప్ ముగించండి',
  keepCardInFrame: 'ID కార్డును ఫ్రేమ్‌లో ఉంచండి',
  cameraNeeded: 'కెమెరా అనుమతి కావాలి',
  allowCamera: 'కెమెరా అనుమతించండి',
  boarded: 'ఎక్కాడు',
  gotOff: 'దిగాడు',
  notBoarded: 'ఇంకా రాలేదు',
  onBoardCount: 'ఎక్కినవారు',
  noVehicle: 'వాహనం కేటాయించలేదు',
  noVehicleBody: 'మీ స్కూల్ అడ్మిన్‌ను వాహనం కేటాయించమని అడగండి.',
  sharingLocation: 'లొకేషన్ షేర్ అవుతోంది',
  // parent home
  hello: 'నమస్కారం',
  todayRide: 'ఈ రోజు ప్రయాణం',
  busOnWay: 'బస్సు దారిలో ఉంది',
  busNotStarted: 'బస్సు ఇంకా బయలుదేరలేదు',
  lastSeen: 'చివరిగా',
  stopsAway: 'స్టాప్‌లు దూరం',
  yourStop: 'మీ స్టాప్',
  noChildren: 'మీ ఖాతాకు పిల్లలు లింక్ కాలేదు. మీ స్కూల్‌ను సంప్రదించండి.',
  openChild: 'వివరాలు చూడండి',
  scanNotGps: 'బస్సు స్థానం డ్రైవర్ ఫోన్ నుండి, ఎక్కడం ID కార్డ్ స్కాన్ నుండి వస్తుంది.',
  // paywall
  subscribeTitle: 'బస్సు ఎక్కగానే నోటిఫికేషన్',
  perkAlerts: 'ID కార్డ్ స్కాన్ అయిన క్షణమే అలర్ట్',
  perkMap: 'మ్యాప్‌లో బస్సు ఎక్కడుందో చూడండి',
  perkLog: 'హాజరు మరియు పూర్తి ప్రయాణ చరిత్ర',
  subscribe: 'చందా తీసుకోండి',
  restore: 'కొనుగోళ్లను పునరుద్ధరించండి',
  planActive: 'చందా చురుగ్గా ఉంది',
  noPlan: 'ప్లాన్ లేదు',
  viewPlans: 'ప్లాన్లు చూడండి',
  // settings
  settings: 'సెట్టింగ్స్',
  profile: 'ప్రొఫైల్',
  language: 'భాష',
  alerts: 'అలర్ట్లు',
  alertBoard: 'బస్సు ఎక్కినప్పుడు',
  alertAlight: 'బస్సు దిగినప్పుడు',
  myChildren: 'నా పిల్లలు',
  vehicle: 'వాహనం',
  locationSharing: 'లొకేషన్ షేరింగ్',
  locationSharingBody: 'ట్రిప్ సమయంలో మీ ఫోన్ లొకేషన్ తల్లిదండ్రులకు కనిపిస్తుంది.',
  help: 'సహాయం',
  privacy: 'గోప్యతా విధానం',
  version: 'వెర్షన్',
  // history
  noRecords: 'ఇంకా రికార్డులు లేవు.',
  attendance: 'హాజరు',
  present: 'హాజరు',
  absent: 'గైర్హాజరు',
  tripsThisMonth: 'ఈ నెల ట్రిప్పులు',
  firstBoarded: 'మొదట ఎక్కింది',
  lastAlighted: 'చివరగా దిగింది',
  errorTitle: 'ఏదో తప్పు జరిగింది',
  cancel: 'రద్దు',
  save: 'సేవ్',
};

const en: typeof te = {
  appName: 'SchoolRide',
  tagline: 'School bus, made safe',
  welcomeTitle: 'Know the moment your child boards',
  welcomeBody: 'Built for Telangana school transport. Free for drivers.',
  getStarted: 'Get started',
  mobileNumber: 'Mobile number',
  sendOtp: 'Send OTP',
  enterOtp: '6-digit OTP',
  verify: 'Verify & continue',
  whoAreYou: 'Who are you?',
  parent: 'Parent',
  driver: 'Driver',
  fullName: 'Full name',
  continue: 'Continue',
  signOut: 'Sign out',
  driverFree: 'Drivers use SchoolRide free of charge.',
  parentHint: 'Subscribe to be alerted the moment your child boards.',
  tabTrip: 'Trip',
  tabStudents: 'Students',
  tabHistory: 'History',
  tabSettings: 'Settings',
  tabHome: 'Home',
  tabLog: 'Log',
  tabPlan: 'Plan',
  startTrip: 'Start a trip',
  startTripBody: "Parents are alerted the moment you scan their child's ID card.",
  morningPickup: 'Morning pickup',
  eveningDrop: 'Evening drop',
  endTrip: 'End trip',
  keepCardInFrame: 'Hold the ID card in the frame',
  cameraNeeded: 'Camera access needed',
  allowCamera: 'Allow camera',
  boarded: 'On board',
  gotOff: 'Got off',
  notBoarded: 'Not boarded yet',
  onBoardCount: 'On board',
  noVehicle: 'No vehicle assigned',
  noVehicleBody: 'Ask your school admin to assign a vehicle.',
  sharingLocation: 'Sharing location',
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
  subscribeTitle: 'Get alerts the moment they board',
  perkAlerts: 'Instant alert when the ID card is scanned',
  perkMap: 'See where the bus is on the map',
  perkLog: 'Attendance and full travel log',
  subscribe: 'Subscribe',
  restore: 'Restore purchases',
  planActive: 'Subscription active',
  noPlan: 'No active plan',
  viewPlans: 'View plans',
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
  noRecords: 'No records yet.',
  attendance: 'Attendance',
  present: 'Present',
  absent: 'Absent',
  tripsThisMonth: 'Trips this month',
  firstBoarded: 'First boarded',
  lastAlighted: 'Last got off',
  errorTitle: 'Something went wrong',
  cancel: 'Cancel',
  save: 'Save',
};

export type TKey = keyof typeof te;
const dictionaries: Record<Lang, Record<TKey, string>> = { te, en };
const STORAGE_KEY = 'schoolride.lang';

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('te');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => v === 'te' || v === 'en' ? setLangState(v) : undefined)
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => undefined);
  }, []);

  const value = useMemo<I18n>(
    () => ({ lang, setLang, t: (key) => dictionaries[lang][key] }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
