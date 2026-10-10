import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card, ScreenHeader, SectionTitle, Segmented, SettingsGroup, SettingsRow } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n, type Lang } from '@/lib/i18n';
import { useShareLocation } from '@/lib/prefs';
import { supabase } from '@/lib/supabase';
import type { Student, Vehicle } from '@/lib/types';
import { colors, fonts, spacing } from '@/theme';

// TODO: replace with the operator's real support number and policy URL before launch.
const SUPPORT_PHONE = '+910000000000';
const PRIVACY_URL = 'https://example.com/privacy';

/** One settings screen for both roles; role-specific sections are switched on `profile.role`. */
export function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { profile, updateProfile, signOut } = useAuth();
  const [shareLocation, setShareLocation] = useShareLocation();
  const [children, setChildren] = useState<Student[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const isDriver = profile?.role === 'driver';

  useEffect(() => {
    if (!profile) return;
    if (isDriver) {
      supabase.from('vehicles').select('*').maybeSingle().then(({ data }) => setVehicle(data as Vehicle | null));
    } else {
      supabase
        .from('parent_students')
        .select('students(*)')
        .eq('parent_id', profile.id)
        .then(({ data }) =>
          setChildren((data ?? []).flatMap((l: any) => (l.students ? [l.students as Student] : []))),
        );
    }
  }, [profile, isDriver]);

  // Language is stored per device (instant) and on the profile (so push text can follow it).
  function changeLang(l: Lang) {
    setLang(l);
    void updateProfile({ language: l });
  }

  async function toggle(field: 'notify_board' | 'notify_alight', value: boolean) {
    const error = await updateProfile({ [field]: value });
    if (error) Alert.alert(t('errorTitle'), error);
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profile}>
          <Avatar name={profile.full_name ?? '?'} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.muted}>
              {profile.phone ? `+${profile.phone.replace(/^\+/, '')} · ` : ''}
              {isDriver ? t('driver') : t('parent')}
            </Text>
          </View>
        </Card>

        <SectionTitle>{t('language')}</SectionTitle>
        <Segmented
          value={lang}
          onChange={changeLang}
          options={[
            { value: 'te', label: 'తెలుగు' },
            { value: 'en', label: 'English' },
          ]}
        />

        {isDriver ? (
          <>
            <SectionTitle>{t('vehicle')}</SectionTitle>
            <SettingsGroup>
              <SettingsRow icon="bus-outline" label={vehicle?.reg_number ?? t('noVehicle')} value={vehicle?.district ?? undefined} hint={vehicle?.school_name} />
              <SettingsRow
                icon="navigate-outline"
                label={t('locationSharing')}
                hint={t('locationSharingBody')}
                toggle={shareLocation}
                onToggle={setShareLocation}
              />
            </SettingsGroup>
          </>
        ) : (
          <>
            <SectionTitle>{t('alerts')}</SectionTitle>
            <SettingsGroup>
              <SettingsRow
                icon="log-in-outline"
                label={t('alertBoard')}
                toggle={profile.notify_board}
                onToggle={(v) => toggle('notify_board', v)}
              />
              <SettingsRow
                icon="log-out-outline"
                label={t('alertAlight')}
                toggle={profile.notify_alight}
                onToggle={(v) => toggle('notify_alight', v)}
              />
            </SettingsGroup>

            <SectionTitle>{t('myChildren')}</SectionTitle>
            <SettingsGroup>
              {children.length === 0 ? (
                <SettingsRow icon="information-circle-outline" label={t('noChildren')} />
              ) : (
                children.map((c) => (
                  <SettingsRow
                    key={c.id}
                    icon="school-outline"
                    label={c.full_name}
                    hint={c.school_name}
                    onPress={() => router.push({ pathname: '/child/[id]', params: { id: c.id } })}
                  />
                ))
              )}
            </SettingsGroup>
          </>
        )}

        <SectionTitle>{t('help')}</SectionTitle>
        <SettingsGroup>
          <SettingsRow icon="call-outline" label={t('help')} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
          <SettingsRow icon="shield-checkmark-outline" label={t('privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
          <SettingsRow icon="information-circle-outline" label={t('version')} value={Constants.expoConfig?.version ?? '1.0.0'} />
        </SettingsGroup>

        <Button title={t('signOut')} variant="secondary" onPress={signOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
