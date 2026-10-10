import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const SHARE_KEY = 'schoolride.shareLocation';

/** Driver preference: share this phone's location with parents during a trip (default on). */
export async function getShareLocation(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SHARE_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export function useShareLocation() {
  const [value, setValue] = useState(true);
  useEffect(() => {
    void getShareLocation().then(setValue);
  }, []);
  const set = useCallback((v: boolean) => {
    setValue(v);
    AsyncStorage.setItem(SHARE_KEY, String(v)).catch(() => undefined);
  }, []);
  return [value, set] as const;
}
