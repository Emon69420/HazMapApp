import { router } from 'expo-router';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Simple timeout to ensure router is ready
    const timeout = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}