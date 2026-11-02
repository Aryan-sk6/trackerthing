import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, LanguagePicker, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { Role } from '@/lib/types';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

function RoleCard({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.roleCard, active && styles.roleCardActive]}
    >
      <Ionicons name={icon} size={36} color={active ? colors.brand : colors.muted} />
      <Text style={styles.roleLabel}>{label}</Text>
    </Pressable>
  );
}

export default function RoleSelect() {
  const { t } = useI18n();
  const { completeProfile, signOut } = useAuth();
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const error = await completeProfile(role, name.trim());
    setBusy(false);
    if (error) Alert.alert(t('errorTitle'), error);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('whoAreYou')} />
      <View style={styles.body}>
        <View style={styles.row}>
          <RoleCard icon="people" label={t('parent')} active={role === 'parent'} onPress={() => setRole('parent')} />
          <RoleCard icon="bus" label={t('driver')} active={role === 'driver'} onPress={() => setRole('driver')} />
        </View>
        <Text style={styles.hint}>{role === 'driver' ? t('driverFree') : t('parentHint')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('fullName')}
          placeholderTextColor={colors.muted}
          textContentType="name"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          accessibilityLabel={t('fullName')}
        />
        <Button title={t('continue')} loading={busy} disabled={name.trim().length < 2} onPress={submit} />
        <LanguagePicker />
        <Button title={t('signOut')} variant="secondary" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  roleCardActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  roleLabel: { ...fonts.bodySemi, fontSize: 18, color: colors.ink },
  hint: { ...fonts.body, fontSize: 16, color: colors.muted },
  input: {
    minHeight: 56,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    ...fonts.bodyMedium,
    fontSize: 18,
    color: colors.ink,
  },
});
