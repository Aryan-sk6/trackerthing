import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { colors, fonts } from '@/theme';

export const tabScreenOptions: NonNullable<ComponentProps<typeof Tabs>['screenOptions']> = {
  headerShown: false,
  tabBarActiveTintColor: colors.brand,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { ...fonts.bodyBold, fontSize: 13 },
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
};

export function tabIcon(name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? focusedName : name} size={26} color={color} />;
  }
  return TabIcon;
}
