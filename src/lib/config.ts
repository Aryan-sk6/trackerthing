/**
 * Per-deployment links, set in .env (see .env.example). Rows that need a link are hidden
 * when it is missing, so a fork never ships a placeholder URL.
 */
export const links = {
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || null,
  terms: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || null,
  /** mailto:, tel: or https: link for the Help row. */
  support: process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() || null,
};
