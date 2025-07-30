import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { Bell, MapPin, Shield, LogOut, TriangleAlert as AlertTriangle, Smartphone, Clock } from 'lucide-react-native';
import { startBackgroundFetch, stopBackgroundFetch, getBackgroundFetchStatus } from '../../services/backgroundTasks';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useLocation } from '../../LocationContext';

interface NotificationSettings {
  emergencyAlerts: boolean;
  pushNotifications: boolean;
}

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuthContext();
  const { location: sharedLocation } = useLocation();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emergencyAlerts: true,
    pushNotifications: true,
  });

  const [backgroundFetchEnabled, setBackgroundFetchEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('Getting location...');

  useEffect(() => {
    // Check background fetch status on component mount
    checkBackgroundFetchStatus();
  }, []);

  useEffect(() => {
    // Update location when sharedLocation changes
    if (sharedLocation) {
      getLocationName(sharedLocation.latitude, sharedLocation.longitude);
    } else {
      // Try to get current location if shared location is not available
      getCurrentLocation();
    }
  }, [sharedLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      getLocationName(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      setUserLocation('Unable to get location');
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=API_KEY_HERE`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find((component: any) => 
          component.types.includes('locality')
        )?.long_name;
        const state = addressComponents.find((component: any) => 
          component.types.includes('administrative_area_level_1')
        )?.short_name;
        
        if (city && state) {
          setUserLocation(`${city}, ${state}`);
        } else {
          setUserLocation(data.results[0].formatted_address);
        }
      } else {
        setUserLocation('Unknown location');
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      setUserLocation('Unable to get location name');
    }
  };

  const checkBackgroundFetchStatus = async () => {
    try {
      const status = await getBackgroundFetchStatus();
      setBackgroundFetchEnabled(status === BackgroundFetch.BackgroundFetchStatus.Available || status === BackgroundFetch.BackgroundFetchStatus.Restricted);
    } catch (error) {
      console.error('Error checking background fetch status:', error);
    }
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleBackgroundFetch = async () => {
    try {
      if (backgroundFetchEnabled) {
        await stopBackgroundFetch();
        setBackgroundFetchEnabled(false);
        Alert.alert('Background Monitoring Disabled', 'Wildfire prediction monitoring has been turned off.');
      } else {
        await startBackgroundFetch();
        setBackgroundFetchEnabled(true);
        Alert.alert('Background Monitoring Enabled', 'Wildfire prediction monitoring is now active. You will receive alerts every 10 minutes if high risk is detected.');
      }
    } catch (error) {
      console.error('Error toggling background fetch:', error);
      Alert.alert('Error', 'Failed to update background monitoring settings.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to sign out...');
              const { error } = await signOut();
              if (error) {
                console.error('Sign out error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              } else {
                console.log('Sign out successful');
                // The auth state change will automatically redirect to login
              }
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
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
        { 
          text: 'Call 911', 
          style: 'destructive', 
          onPress: () => {
            Linking.openURL('tel:911');
          }
        },
      ]
    );
  };

  const testWildfirePrediction = async () => {
    try {
      Alert.alert(
        'Test Wildfire Prediction',
        'This will test the wildfire prediction API and send a notification if high risk is detected. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Test', 
            onPress: async () => {
              // Import the background task function directly for testing
              const { fetchWildfirePrediction, fetchEnvironmentalData, fetchPollutantData, sendWildfireAlert } = await import('../../services/backgroundTasks');
              
              // Get current location
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Error', 'Location permission required for testing.');
                return;
              }

              const location = await Location.getCurrentPositionAsync({});
              const { latitude: lat, longitude: lng } = location.coords;

              // Fetch data and make prediction
              const envData = await fetchEnvironmentalData(lat, lng);
              const pollutantData = await fetchPollutantData(lat, lng);
              const prediction = await fetchWildfirePrediction(lat, lng, envData, pollutantData);

              if (prediction) {
                Alert.alert('Prediction Result', `Wildfire risk level: ${prediction}`);
                
                // Send test notification for any prediction
                await sendWildfireAlert(prediction, lat, lng);
                Alert.alert('Test Complete', `Notification sent for ${prediction} risk level.`);
              } else {
                Alert.alert('Test Failed', 'Could not get prediction result.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error testing wildfire prediction:', error);
      Alert.alert('Error', 'Failed to test wildfire prediction.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{authUser?.email || 'Signed Out'}</Text>
          </View>
          <View style={styles.locationInfo}>
            <MapPin size={16} color="#888" />
            <Text style={styles.locationText}>{userLocation}</Text>
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
                <Text style={styles.settingName}>Alerts</Text>
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

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Clock size={20} color="#8B5CF6" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Background Monitoring</Text>
                <Text style={styles.settingDescription}>
                  Check wildfire risk every 10 minutes
                </Text>
              </View>
            </View>
            <Switch
              value={backgroundFetchEnabled}
              onValueChange={toggleBackgroundFetch}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>



        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>HazMap v1.0.0</Text>
          <Text style={styles.footerText}>Built for community & development</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 30,
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
  profileCard: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'left',
    fontWeight: '600',
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
  testButton: {
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
  testButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
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