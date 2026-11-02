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
import { colors, fonts, radius, shadow, spacing, TOUCH } from '@/theme';
import { languageNames, languages, useI18n } from '@/lib/i18n';

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
  const bg = variant === 'primary' ? colors.brand : variant === 'danger' ? colors.danger : colors.brandSoft;
  const fg = variant === 'secondary' ? colors.brand : colors.onBrand;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? colors.border : bg },
        variant === 'primary' && !disabled && styles.buttonLift,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
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

export function Empty({ text, icon = 'file-tray-outline' }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.muted} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export type BadgeTone = 'success' | 'brand' | 'neutral' | 'danger';
const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: colors.success },
  brand: { bg: colors.brandSoft, fg: colors.brand },
  neutral: { bg: colors.bg, fg: colors.muted },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

/** App mark: a bus on a school-bus-yellow tile. Swap this one component to rebrand a fork. */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}
    >
      <Ionicons name="bus" size={size * 0.56} color={colors.ink} />
    </View>
  );
}

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
  const { bg, fg } = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={15} color={fg} />
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

/** Large-title header on the page background. Replaces the default navigation header. */
export function ScreenHeader({
  title,
  subtitle,
  back,
  showCrest,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  showCrest?: boolean;
  rightAction?: { label: string; onPress: () => void };
}) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.brand} />
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
      )}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
          <Text style={styles.headerTitle} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {rightAction && (
          <Pressable accessibilityRole="button" onPress={rightAction.onPress} hitSlop={12}>
            <Text style={styles.headerActionText}>{rightAction.label}</Text>
          </Pressable>
        )}
        {showCrest && <BrandMark size={40} />}
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
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
  const tint = destructive ? colors.danger : colors.brand;
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.dangerSoft : colors.brandSoft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ true: colors.success, false: colors.border }}
          thumbColor="#fff"
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && { backgroundColor: colors.bg }}
    >
      {content}
    </Pressable>
  );
}

export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

/** Segmented control (trip kind, language): grey track, white pill on the selected option. */
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
            style={[styles.segment, active && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, active && { color: colors.ink }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Language switcher. Renders nothing until a second language is registered in i18n.tsx. */
export function LanguagePicker({ onChange }: { onChange?: (lang: (typeof languages)[number]) => void }) {
  const { lang, setLang } = useI18n();
  if (languages.length < 2) return null;
  return (
    <Segmented
      value={lang}
      onChange={(l) => {
        setLang(l);
        onChange?.(l);
      }}
      options={languages.map((l) => ({ value: l, label: languageNames[l] }))}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLift: {
    shadowColor: colors.brand,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: { fontSize: 17, ...fonts.bodySemi, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow,
  },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.muted, textAlign: 'center', ...fonts.body, fontSize: 15, lineHeight: 21 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { ...fonts.bodySemi, fontSize: 14 },
  mark: { backgroundColor: colors.bus, alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.brand, ...fonts.bodyBold },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH - 8, alignSelf: 'flex-start', marginLeft: -6 },
  backText: { ...fonts.body, fontSize: 17, color: colors.brand },
  headerSub: { color: colors.muted, ...fonts.bodyMedium, fontSize: 15 },
  headerTitle: { color: colors.ink, ...fonts.displayHeavy, fontSize: 32 },
  headerActionText: { color: colors.brand, ...fonts.bodySemi, fontSize: 17 },
  sectionTitle: {
    ...fonts.bodySemi,
    fontSize: 13,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...fonts.bodyMedium, fontSize: 16, color: colors.ink },
  rowHint: { ...fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
  rowValue: { ...fonts.body, fontSize: 15, color: colors.muted },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#ECEEF2',
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: radius.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: { backgroundColor: colors.card, ...shadow },
  segmentText: { ...fonts.bodySemi, fontSize: 15, color: colors.muted, textAlign: 'center' },
});
