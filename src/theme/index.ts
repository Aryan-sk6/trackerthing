/** SchoolRide design system: Telangana palette (see the design canvas). */
export const colors = {
  indigo: '#23306B', // Pochampally indigo: headers, brand
  primary: '#F2A71B', // Bathukamma marigold: the one main action per screen
  primaryDark: '#23306B',
  terracotta: '#B8402A', // Sindoor: alerts, danger
  green: '#2F7D4F', // Tangedu green: boarded, success
  pink: '#C2336B', // Gunuka pink: premium accent
  bg: '#F6EBD6', // Kakatiya sandstone
  card: '#FFFBF2', // Temple cream
  border: '#E3D3B3',
  ink: '#1D1B2E', // Granite
  muted: '#5E5A6B',
  onIndigo: '#FFFBF2',
  onIndigoMuted: '#E6E1F2',
  danger: '#B8402A',
  success: '#2F7D4F',
  info: '#23306B',
} as const;

export const fonts = {
  display: 'BalooTammudu2_700Bold',
  displayHeavy: 'BalooTammudu2_800ExtraBold',
  body: 'Mukta_400Regular',
  bodyMedium: 'Mukta_500Medium',
  bodySemi: 'Mukta_600SemiBold',
  bodyBold: 'Mukta_700Bold',
  telugu: 'NotoSansTelugu_400Regular',
  teluguBold: 'NotoSansTelugu_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

/** Minimum touch target. Drivers tap with one hand, on the move. */
export const TOUCH = 48;
