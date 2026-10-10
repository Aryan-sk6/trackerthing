import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function PaywallNotice() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscribe to get live alerts</Text>
      <Text style={styles.body}>
        Know the moment your child boards or leaves the vehicle, plus the full attendance and
        travel log.
      </Text>
      <Button title="View plans" onPress={() => router.navigate('/(parent)/subscription')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  body: { color: colors.muted, fontSize: 15 },
});
