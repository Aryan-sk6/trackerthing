import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenHeader, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { isBackendConfigured } from '@/lib/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Login() {
  const { t } = useI18n();
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>, onOk: () => void) {
    setBusy(true);
    const error = await action();
    setBusy(false);
    if (error) Alert.alert(t('errorTitle'), error);
    else onOk();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader title={t('appName')} back />
      <View style={styles.body}>
        {!isBackendConfigured && (
          <Text style={styles.warning}>
            Backend not configured. Copy .env.example to .env and add your Supabase keys.
          </Text>
        )}

        <Text style={styles.label}>{t('mobileNumber')}</Text>
        <View style={[styles.inputWrap, codeSent && { opacity: 0.6 }]}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="98480 12345"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!codeSent}
            maxLength={13}
            accessibilityLabel={t('mobileNumber')}
          />
        </View>

        {codeSent && (
          <>
            <Text style={styles.label}>{t('enterOtp')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.otp]}
                placeholder="••••••"
                placeholderTextColor={colors.border}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                autoFocus
                textContentType="oneTimeCode"
                accessibilityLabel={t('enterOtp')}
              />
            </View>
          </>
        )}

        {codeSent ? (
          <Button
            title={t('verify')}
            loading={busy}
            disabled={code.length < 6}
            onPress={() => run(() => verifyOtp(phone, code), () => router.replace('/'))}
          />
        ) : (
          <Button
            title={t('sendOtp')}
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
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, gap: spacing.md },
  warning: { color: colors.terracotta, fontFamily: fonts.bodyMedium },
  label: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 2,
    borderColor: colors.indigo,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  prefix: {
    height: '100%',
    textAlignVertical: 'center',
    paddingHorizontal: 14,
    lineHeight: 52,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    backgroundColor: colors.bg,
    color: colors.ink,
  },
  input: { flex: 1, paddingHorizontal: 14, fontFamily: fonts.bodyMedium, fontSize: 20, color: colors.ink },
  otp: { letterSpacing: 8, textAlign: 'center' },
});
