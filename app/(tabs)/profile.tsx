import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { User, Bell, MapPin, Shield, Settings, LogOut, ChevronRight, Moon, Smartphone, TriangleAlert as AlertTriangle, Heart } from 'lucide-react-native';

interface NotificationSettings {
  emergencyAlerts: boolean;
  evacuationUpdates: boolean;
  airQualityWarnings: boolean;
  communityUpdates: boolean;
  pushNotifications: boolean;
}

export default function ProfileScreen() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emergencyAlerts: true,
    evacuationUpdates: true,
    airQualityWarnings: true,
    communityUpdates: false,
    pushNotifications: true,
  });

  const [locationSettings, setLocationSettings] = useState({
    preciseLocation: true,
    backgroundLocation: true,
  });

  const user = {
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'Citizen',
    joinDate: 'January 2024',
    location: 'Los Angeles, CA',
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleLocation = (key: keyof typeof locationSettings) => {
    setLocationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login')
        },
      ]
    );
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'This will call 911. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 911', style: 'destructive', onPress: () => console.log('Calling 911...') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>{user.role} • Member since {user.joinDate}</Text>
            </View>
          </View>
          
          <View style={styles.locationInfo}>
            <MapPin size={16} color="#888" />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        </View>

        <View style={styles.emergencySection}>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={handleEmergencyContact}
          >
            <AlertTriangle size={24} color="#FFFFFF" />
            <Text style={styles.emergencyText}>Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#FF6B35" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Emergency Alerts</Text>
                <Text style={styles.settingDescription}>
                  Critical fire and evacuation alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.emergencyAlerts}
              onValueChange={() => toggleNotification('emergencyAlerts')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color="#22C55E" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Evacuation Updates</Text>
                <Text style={styles.settingDescription}>
                  Zone changes and route updates
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.evacuationUpdates}
              onValueChange={() => toggleNotification('evacuationUpdates')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Moon size={20} color="#8B5CF6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Air Quality Warnings</Text>
                <Text style={styles.settingDescription}>
                  Unhealthy air quality notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.airQualityWarnings}
              onValueChange={() => toggleNotification('airQualityWarnings')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <User size={20} color="#3B82F6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Community Updates</Text>
                <Text style={styles.settingDescription}>
                  Nearby community posts and reports
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.communityUpdates}
              onValueChange={() => toggleNotification('communityUpdates')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Smartphone size={20} color="#10B981" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Allow notifications on this device
                </Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.pushNotifications}
              onValueChange={() => toggleNotification('pushNotifications')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MapPin size={20} color="#F97316" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Precise Location</Text>
                <Text style={styles.settingDescription}>
                  Accurate location for emergency services
                </Text>
              </View>
            </View>
            <Switch
              value={locationSettings.preciseLocation}
              onValueChange={() => toggleLocation('preciseLocation')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color="#EAB308" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Background Location</Text>
                <Text style={styles.settingDescription}>
                  Location updates when app is closed
                </Text>
              </View>
            </View>
            <Switch
              value={locationSettings.backgroundLocation}
              onValueChange={() => toggleLocation('backgroundLocation')}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Heart size={20} color="#EF4444" />
            <Text style={styles.menuText}>Emergency Contacts</Text>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color="#10B981" />
            <Text style={styles.menuText}>Help & Support</Text>
            <ChevronRight size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>WildSafe Emergency Response v1.0.0</Text>
          <Text style={styles.footerText}>Built for community safety</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 4,
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#666',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#888',
  },
  emergencySection: {
    margin: 20,
    marginTop: 0,
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});