import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { isBackendConfigured } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>, onOk: () => void) {
    setBusy(true);
    const error = await action();
    setBusy(false);
    if (error) Alert.alert('Something went wrong', error);
    else onOk();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>SchoolRide</Text>
      <Text style={styles.subtitle}>Safe school transport, in your pocket.</Text>

      {!isBackendConfigured && (
        <Text style={styles.warning}>
          Backend not configured. Copy .env.example to .env and add your Supabase keys.
        </Text>
      )}

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <TextInput
          style={styles.input}
          placeholder="Mobile number (10 digits)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!codeSent}
          maxLength={13}
        />
        {codeSent && (
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            autoFocus
          />
        )}
        {codeSent ? (
          <Button
            title="Verify & continue"
            loading={busy}
            disabled={code.length < 6}
            onPress={() => run(() => verifyOtp(phone, code), () => router.replace('/'))}
          />
        ) : (
          <Button
            title="Send OTP"
            loading={busy}
            disabled={phone.replace(/\D/g, '').length < 10}
            onPress={() => run(() => sendOtp(phone), () => setCodeSent(true))}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: 36, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 16, color: colors.muted, marginTop: spacing.xs },
  warning: { marginTop: spacing.md, color: colors.danger },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
  },
});
