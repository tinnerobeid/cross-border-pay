import { Stack } from 'expo-router';


export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transfer/confirm" />
      <Stack.Screen name="transfer/success" />
      <Stack.Screen name="recipient/add" />
      <Stack.Screen name="kyc/id" />
      <Stack.Screen name="kyc/liveness" />
      <Stack.Screen name="kyc/address" />
      <Stack.Screen name="kyc/pending" />
      <Stack.Screen name="(auth)/verify" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/pin" />
    </Stack>
  );
}