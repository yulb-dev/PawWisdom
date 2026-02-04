import { Stack } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../config/query-client.config'
import { DialogProvider } from '../components/ui/DialogProvider'

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/verify" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </DialogProvider>
    </QueryClientProvider>
  )
}
