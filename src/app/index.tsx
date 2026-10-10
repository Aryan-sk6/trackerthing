import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/role" />;
  return <Redirect href={profile.role === 'driver' ? '/(driver)' : '/(parent)'} />;
}
