import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { LocationProvider } from '../LocationContext';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { startBackgroundFetch } from '../services/backgroundTasks';

function RootLayoutContent() {
  const { loading, isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Start background fetch when app is ready
    const initBackgroundTasks = async () => {
      try {
        await startBackgroundFetch();
        console.log('Background tasks initialized');
      } catch (error) {
        console.error('Failed to initialize background tasks:', error);
      }
    };

    if (!loading) {
      initBackgroundTasks();
    }
  }, [loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <LocationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </LocationProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
