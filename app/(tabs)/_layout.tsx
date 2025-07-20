import { Tabs } from 'expo-router';
import { 
  MapPin, 
  Wind, 
  Shield, 
  MessageSquare, 
  User 
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="air-quality"
        options={{
          title: 'Air Quality',
          tabBarIcon: ({ size, color }) => (
            <Wind size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="evacuation"
        options={{
          title: 'Evacuation',
          tabBarIcon: ({ size, color }) => (
            <Shield size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: ({ size, color }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}