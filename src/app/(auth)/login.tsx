import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, ScreenHeader } from '@/components/ui';
import { DEFAULT_DIAL_CODE, isPlausibleE164, toE164, useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { isBackendConfigured } from '@/lib/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

const RESEND_AFTER_S = 30;

/** "+447700900123" → "+44 77•••• 0123": enough to recognise, not enough to read over a shoulder. */
function maskPhone(e164: string): string {
  if (e164.length < 8) return e164;
  return `${e164.slice(0, 5)}${'•'.repeat(Math.max(0, e164.length - 9))} ${e164.slice(-4)}`;
}

export default function Login() {
  const { t } = useI18n();
  const { sendOtp, verifyOtp, startDemo } = useAuth();
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const e164 = toE164(dialCode, phone);
  const valid = isPlausibleE164(e164);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function send() {
    setBusy(true);
    const error = await sendOtp(e164);
    setBusy(false);
    if (error) return Alert.alert(t('errorTitle'), error);
    setSentTo(e164);
    setResendIn(RESEND_AFTER_S);
  }

  async function verify() {
    if (!sentTo) return;
    setBusy(true);
    // AuthGate moves the user on once the session arrives.
    const error = await verifyOtp(sentTo, code);
    setBusy(false);
    if (error) Alert.alert(t('errorTitle'), error);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScreenHeader title={t('appName')} back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!isBackendConfigured && <Text style={styles.warning}>{t('backendMissing')}</Text>}

        {!sentTo ? (
          <>
            <Text style={styles.label}>{t('mobileNumber')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.dial}
                value={dialCode}
                onChangeText={(v) => setDialCode(v.startsWith('+') ? v : `+${v.replace(/\D/g, '')}`)}
                keyboardType="phone-pad"
                maxLength={5}
                accessibilityLabel={t('countryCode')}
              />
              <TextInput
                style={styles.input}
                placeholder="555 123 4567"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
                maxLength={20}
                accessibilityLabel={t('mobileNumber')}
              />
            </View>
            <Text style={styles.hint}>{t('phoneHint')}</Text>
            <Button title={t('sendOtp')} loading={busy} disabled={!valid} onPress={send} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>
              {t('codeSentTo')} {maskPhone(sentTo)}
            </Text>
            <Text style={styles.label}>{t('enterOtp')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.otp]}
                placeholder="••••••"
                placeholderTextColor={colors.border}
                keyboardType="number-pad"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                maxLength={6}
                autoFocus
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                accessibilityLabel={t('enterOtp')}
              />
            </View>
            <Button title={t('verify')} loading={busy} disabled={code.length < 6} onPress={verify} />
            <View style={styles.links}>
              <Pressable accessibilityRole="button" hitSlop={12} onPress={() => { setSentTo(null); setCode(''); }}>
                <Text style={styles.link}>{t('changeNumber')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={12} disabled={resendIn > 0 || busy} onPress={send}>
                <Text style={[styles.link, resendIn > 0 && { color: colors.muted }]}>
                  {t('sendOtp')}
                  {resendIn > 0 ? ` (${resendIn}s)` : ''}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        <Button title={t('tryDemo')} variant="secondary" onPress={() => startDemo('parent')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.lg, gap: spacing.md },
  warning: { color: colors.danger, ...fonts.bodyMedium },
  label: { ...fonts.bodyBold, fontSize: 16, color: colors.ink },
  hint: { ...fonts.body, fontSize: 14, color: colors.muted },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  dial: {
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minWidth: 72,
    paddingHorizontal: 12,
    ...fonts.bodyBold,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: colors.bg,
    color: colors.ink,
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, ...fonts.bodyMedium, fontSize: 20, color: colors.ink },
  otp: { letterSpacing: 8, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { ...fonts.bodyBold, fontSize: 16, color: colors.brand },
});
