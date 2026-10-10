import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

/** RevenueCat entitlement that unlocks parent features. */
export const ENTITLEMENT = 'parent_access';

let configured = false;

export function configurePurchases(userId: string): boolean {
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!apiKey) return false;
  try {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId });
      configured = true;
    } else {
      void Purchases.logIn(userId);
    }
    return true;
  } catch {
    // Native module missing (e.g. Expo Go) - subscriptions need a development build.
    return false;
  }
}

export function hasAccess(info: CustomerInfo): boolean {
  return ENTITLEMENT in info.entitlements.active;
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return hasAccess(customerInfo);
}

export async function restore(): Promise<boolean> {
  return hasAccess(await Purchases.restorePurchases());
}
