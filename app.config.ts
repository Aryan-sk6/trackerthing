import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Deployment-specific values come from the environment (.env locally, EAS environment variables
 * in the cloud), so a fork never edits committed files to ship its own build. See .env.example.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const bundleId = process.env.APP_BUNDLE_ID;
  const projectId = process.env.EAS_PROJECT_ID;
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

  return {
    ...config,
    name: process.env.APP_NAME ?? config.name ?? 'SchoolRide',
    slug: config.slug ?? 'school-ride-tracker',
    ios: { ...config.ios, ...(bundleId ? { bundleIdentifier: bundleId } : {}) },
    android: {
      ...config.android,
      ...(bundleId ? { package: bundleId } : {}),
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
    extra: { ...config.extra, ...(projectId ? { eas: { projectId } } : {}) },
  };
};
