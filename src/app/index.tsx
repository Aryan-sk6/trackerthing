import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }
  if (!session) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/role" />;
  return <Redirect href={profile.role === 'driver' ? '/(driver)' : '/(parent)'} />;
}
