import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

export default function RoleSelect() {
  const { completeProfile, signOut } = useAuth();
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const error = await completeProfile(role, name.trim());
    setBusy(false);
    if (error) Alert.alert('Could not save', error);
    else router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      <View style={styles.row}>
        <Button
          title="Parent"
          variant={role === 'parent' ? 'primary' : 'secondary'}
          onPress={() => setRole('parent')}
          style={{ flex: 1 }}
        />
        <Button
          title="Driver"
          variant={role === 'driver' ? 'primary' : 'secondary'}
          onPress={() => setRole('driver')}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={styles.hint}>
        {role === 'driver'
          ? 'Drivers use SchoolRide free of charge.'
          : 'Parents get instant boarding alerts with a subscription.'}
      </Text>
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <Button title="Continue" loading={busy} disabled={name.trim().length < 2} onPress={submit} />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: spacing.md },
  hint: { color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
  },
});
