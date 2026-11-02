import type { TextStyle, ViewStyle } from 'react-native';

/**
 * SchoolRide design tokens: neutral surfaces, one blue for actions, school-bus yellow only for
 * the bus itself (map marker, app mark). Rebrand a fork by changing these values.
 */
export const colors = {
  brand: '#2459E0', // actions, links, selected states
  brandSoft: '#E9EFFD', // selected backgrounds, secondary buttons
  bus: '#F5B400', // the bus: map marker and app mark only
  danger: '#D93B30',
  dangerSoft: '#FDECEA',
  success: '#17864B',
  successSoft: '#E5F4EC',
  bg: '#F5F6F8',
  card: '#FFFFFF',
  border: '#E3E6EC',
  ink: '#111827',
  muted: '#6B7280',
  onBrand: '#FFFFFF',
} as const;

/**
 * Text weights on the platform system font (San Francisco / Roboto). The system font covers
 * every script, so translations need no extra font files. Spread into a style: `...fonts.bodyBold`.
 */
export const fonts = {
  display: { fontWeight: '700', letterSpacing: -0.3 },
  displayHeavy: { fontWeight: '800', letterSpacing: -0.6 },
  body: { fontWeight: '400' },
  bodyMedium: { fontWeight: '500' },
  bodySemi: { fontWeight: '600' },
  bodyBold: { fontWeight: '700' },
} as const satisfies Record<string, TextStyle>;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

/** Soft elevation for cards and sheets, in place of outlines. */
export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const satisfies ViewStyle;

/** Minimum touch target. Drivers tap with one hand, on the move. */
export const TOUCH = 48;
