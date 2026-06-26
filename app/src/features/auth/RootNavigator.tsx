import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { SplashScreen } from '../../components/SplashScreen';
import { useAuth } from '../../lib/privy/hooks';
import { colors } from '../../lib/theme';

/**
 * Routes between the auth group and the app based on Privy auth state. Renders a
 * splash until Privy finishes initializing (`isReady`).
 */
export function RootNavigator() {
  const { isReady, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, segments, router]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
