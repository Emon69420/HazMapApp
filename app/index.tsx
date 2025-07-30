import { Redirect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function App() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect based on authentication state
  if (session) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}