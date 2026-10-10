import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, TOUCH } from '@/theme';
import { Frieze, Thoranam } from './motifs';

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.terracotta : colors.card;
  const fg = variant === 'danger' ? '#fff' : variant === 'secondary' ? colors.indigo : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? colors.border : bg, opacity: pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 2, borderColor: colors.indigo },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: disabled ? colors.muted : fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export type BadgeTone = 'green' | 'indigo' | 'neutral' | 'pink' | 'terracotta';
const toneBg: Record<BadgeTone, string> = {
  green: colors.green,
  indigo: colors.indigo,
  neutral: colors.border,
  pink: colors.pink,
  terracotta: colors.terracotta,
};

/** Status is always icon + text, never colour alone. */
export function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: BadgeTone;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const fg = tone === 'neutral' ? colors.ink : '#fff';
  return (
    <View style={[styles.badge, { backgroundColor: toneBg[tone] }]}>
      <Ionicons name={icon} size={16} color={fg} />
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.45 }]}>{name.trim().charAt(0)}</Text>
    </View>
  );
}

/** Indigo header with the stone frieze underneath. Replaces the default navigation header. */
export function ScreenHeader({
  title,
  subtitle,
  back,
  showCrest,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  showCrest?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={26} color={colors.onIndigo} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {showCrest && <Thoranam width={44} />}
      </View>
      <Frieze />
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/** Settings list row: label, optional value, optional switch or chevron. */
export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  onToggle,
  hint,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  hint?: string;
  destructive?: boolean;
}) {
  const tint = destructive ? colors.terracotta : colors.indigo;
  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={24} color={tint} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, destructive && { color: colors.terracotta }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ true: colors.green, false: colors.border }}
          thumbColor="#fff"
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

/** Two-option segmented control (language, trip kind). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 18, fontFamily: fonts.bodyBold },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  avatar: { backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontFamily: fonts.displayHeavy },
  header: {
    backgroundColor: colors.indigo,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: { width: TOUCH - 8, height: TOUCH - 8, alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: colors.primary, fontFamily: fonts.bodySemi, fontSize: 14 },
  headerTitle: { color: colors.onIndigo, fontFamily: fonts.display, fontSize: 28, lineHeight: 36 },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 17, color: colors.ink },
  rowHint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  rowValue: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.muted },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: TOUCH,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.indigo },
});
