import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Token registered by this device in this app session, so sign-out can remove it. */
let currentToken: string | null = null;

/** Asks permission, fetches the Expo push token and stores it on the profile. */
export async function registerForPush(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('boarding', {
      name: 'Boarding alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const status =
    existing.status === 'granted'
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null; // EAS project id not configured (see README).
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  currentToken = token;
  await supabase.from('push_tokens').upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  return token;
}

/** Removes this device's token for the user. Call before signing out or deleting the account. */
export async function unregisterPush(userId: string): Promise<void> {
  if (!currentToken) return;
  await supabase.from('push_tokens').delete().eq('user_id', userId).eq('token', currentToken);
  currentToken = null;
}
