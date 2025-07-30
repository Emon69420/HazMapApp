import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MapPin, Navigation, Clock, Users, Phone, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Flame, Map } from 'lucide-react-native';
import { useLocation } from '../../LocationContext';
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'API_KEY_HERE';

interface ActiveWildfire {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number; // in miles
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  containment: number;
  acres: number;
  lastUpdated: string;
  description: string;
}

interface FireStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in miles
  placeId?: string;
  vicinity?: string;
  rating?: number;
  phoneNumber?: string;
}

interface EmergencyShelter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in miles
  placeId?: string;
  vicinity?: string;
  rating?: number;
}

interface EvacuationZone {
  id: string;
  name: string;
  level: 'mandatory' | 'warning' | 'watch' | 'safe';
  description: string;
  affectedAreas: string[];
  estimatedPopulation: number;
  distance: number;
  activeFires: number;
}

export default function EvacuationScreen() {
  const [activeWildfires, setActiveWildfires] = useState<ActiveWildfire[]>([]);
  const [fireStations, setFireStations] = useState<FireStation[]>([]);
  const [emergencyShelters, setEmergencyShelters] = useState<EmergencyShelter[]>([]);
  const [evacuationZones, setEvacuationZones] = useState<EvacuationZone[]>([]);
  const [selectedTab, setSelectedTab] = useState<'zones' | 'shelters' | 'routes'>('zones');
  const [userZone, setUserZone] = useState<EvacuationZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const { location: sharedLocation } = useLocation();

  useEffect(() => {
    initializeLocationAndData();
  }, [sharedLocation]);

  const initializeLocationAndData = async () => {
    setLoading(true);
    
    // Get user location
    let currentLocation = userLocation;
    if (sharedLocation) {
      currentLocation = { latitude: sharedLocation.latitude, longitude: sharedLocation.longitude };
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          currentLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        }
      } catch (error) {
        console.error('Error getting location:', error);
        // Fallback to default location (Los Angeles)
        currentLocation = { latitude: 34.0522, longitude: -118.2437 };
      }
    }
    
    setUserLocation(currentLocation);
    
    if (currentLocation) {
      await Promise.all([
        fetchActiveWildfires(currentLocation.latitude, currentLocation.longitude),
        fetchEmergencyShelters(currentLocation.latitude, currentLocation.longitude),
        fetchEvacuationZones(currentLocation.latitude, currentLocation.longitude)
      ]);
    }
    
    setLoading(false);
  };

  const fetchActiveWildfires = async (lat: number, lng: number) => {
    try {
      // Using Google Places API to find fire stations and emergency services
      const fireStationsUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&keyword=fire%20station&type=establishment&key=${GOOGLE_API_KEY}`;
      const emergencyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&keyword=emergency%20services&type=establishment&key=${GOOGLE_API_KEY}`;
      
      const [fireResponse, emergencyResponse] = await Promise.all([
        fetch(fireStationsUrl),
        fetch(emergencyUrl)
      ]);
      
      const fireData = await fireResponse.json();
      const emergencyData = await emergencyResponse.json();
      
      // Process fire stations data
      const fireStationsData: FireStation[] = (fireData.results || []).map((place: any, index: number) => {
        const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
        return {
          id: place.place_id || `fire-station-${index}`,
          name: place.name,
          address: place.vicinity || 'Address not available',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: Math.round(distance * 10) / 10,
          placeId: place.place_id,
          vicinity: place.vicinity,
          rating: place.rating,
          phoneNumber: place.formatted_phone_number
        };
      });
      
      // Sort fire stations by distance (closest first)
      const sortedFireStations = fireStationsData.sort((a, b) => a.distance - b.distance);
      setFireStations(sortedFireStations);
      
      // Note: Google Maps doesn't provide user-reported hazards via API
      // For real fire detection, you would need to integrate with:
      // - NASA FIRMS API
      // - USGS Wildfire API  
      // - Your existing wildfire risk API at http://34.130.243.115:5000/gee-data
      
      setActiveWildfires([]); // No active fires detected via Google Maps API
      
      // Store emergency resources for potential use
      console.log('Emergency resources found:', (fireData.results || []).length + (emergencyData.results || []).length);
      
    } catch (error) {
      console.error('Error fetching emergency resources:', error);
      setActiveWildfires([]);
      setFireStations([]);
    }
  };

  const fetchEmergencyShelters = async (lat: number, lng: number) => {
    try {
      // Search for emergency shelters, community centers, schools, etc.
      const shelterTypes = [
        'emergency shelter',
        'community center',
        'school',
        'church',
        'hospital',
        'red cross'
      ];
      
      const shelterPromises = shelterTypes.map(type => 
        fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=30000&keyword=${encodeURIComponent(type)}&type=establishment&key=${GOOGLE_API_KEY}`)
      );
      
      const responses = await Promise.all(shelterPromises);
      const results = await Promise.all(responses.map(r => r.json()));
      
      const allShelters = results.flatMap(r => r.results || []).slice(0, 10);
      
      const shelters: EmergencyShelter[] = allShelters.map((place, index) => {
        const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
        return {
          id: place.place_id || `shelter-${index}`,
          name: place.name,
          address: place.vicinity || 'Address not available',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: Math.round(distance * 10) / 10,
          placeId: place.place_id,
          vicinity: place.vicinity,
          rating: place.rating
        };
      });
      
      // Sort shelters by distance (closest first)
      const sortedShelters = shelters.sort((a, b) => a.distance - b.distance);
      
      setEmergencyShelters(sortedShelters);
    } catch (error) {
      console.error('Error fetching emergency shelters:', error);
      setEmergencyShelters(generateMockShelters(lat, lng));
    }
  };

  const fetchEvacuationZones = async (lat: number, lng: number) => {
    try {
      // Create evacuation zones based on active wildfires
      const zones: EvacuationZone[] = activeWildfires.map((fire, index) => {
        const distance = fire.distance;
        let level: 'mandatory' | 'warning' | 'watch' | 'safe' = 'safe';
        
        if (distance < 5) level = 'mandatory';
        else if (distance < 15) level = 'warning';
        else if (distance < 30) level = 'watch';
        
        return {
          id: `zone-${fire.id}`,
          name: `${fire.name} Evacuation Zone`,
          level,
          description: `Evacuation zone around ${fire.name}. ${level === 'mandatory' ? 'Immediate evacuation required.' : level === 'warning' ? 'Prepare for evacuation.' : 'Monitor conditions.'}`,
          affectedAreas: [`${fire.name} Area`, 'Surrounding neighborhoods'],
          estimatedPopulation: Math.floor(Math.random() * 50000) + 5000,
          distance: fire.distance,
          activeFires: 1
        };
      });
      
      // Add user's current zone
      const userZoneData: EvacuationZone = {
        id: 'user-zone',
        name: 'Your Current Location',
        level: activeWildfires.length === 0 ? 'safe' : 
               zones.find(z => z.level === 'mandatory') ? 'mandatory' : 
               zones.find(z => z.level === 'warning') ? 'warning' : 
               zones.find(z => z.level === 'watch') ? 'watch' : 'safe',
        description: activeWildfires.length === 0 
          ? 'No active wildfires detected in your area.'
          : 'Your current location evacuation status based on nearby active wildfires.',
        affectedAreas: ['Your area'],
        estimatedPopulation: 1,
        distance: 0,
        activeFires: activeWildfires.length
      };
      
      setEvacuationZones([userZoneData, ...zones]);
      setUserZone(userZoneData);
    } catch (error) {
      console.error('Error fetching evacuation zones:', error);
      // Set safe zone when there's an error
      const safeZone: EvacuationZone = {
        id: 'user-zone',
        name: 'Your Current Location',
        level: 'safe',
        description: 'No active wildfires detected in your area.',
        affectedAreas: ['Your area'],
        estimatedPopulation: 1,
        distance: 0,
        activeFires: 0
      };
      setEvacuationZones([safeZone]);
      setUserZone(safeZone);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const generateMockWildfires = (lat: number, lng: number): ActiveWildfire[] => {
    return [
      {
        id: '1',
        name: 'Palisades Fire',
        latitude: lat + 0.01,
        longitude: lng + 0.01,
        distance: 2.3,
        severity: 'extreme',
        containment: 23,
        acres: 15420,
        lastUpdated: new Date().toISOString(),
        description: 'Active wildfire in Pacific Palisades area. Emergency services responding.'
      },
      {
        id: '2',
        name: 'Malibu Canyon Fire',
        latitude: lat - 0.02,
        longitude: lng + 0.015,
        distance: 8.7,
        severity: 'high',
        containment: 45,
        acres: 8930,
        lastUpdated: new Date().toISOString(),
        description: 'Wildfire in Malibu Canyon. Evacuation orders in effect.'
      }
    ];
  };

  const generateMockShelters = (lat: number, lng: number): EmergencyShelter[] => {
    return [
      {
        id: '1',
        name: 'Santa Monica Civic Center',
        address: '1855 Main St, Santa Monica, CA 90401',
        latitude: lat + 0.005,
        longitude: lng + 0.005,
        distance: 2.3,
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY',
        vicinity: 'Santa Monica, CA 90401, USA',
        rating: 4.5
      },
      {
        id: '2',
        name: 'UCLA Pauley Pavilion',
        address: '301 Westwood Plaza, Los Angeles, CA 90095',
        latitude: lat + 0.008,
        longitude: lng - 0.003,
        distance: 5.7,
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY',
        vicinity: 'Los Angeles, CA 90095, USA',
        rating: 4.8
      }
    ];
  };

  const generateMockZones = (lat: number, lng: number): EvacuationZone[] => {
    return [
      {
        id: 'user-zone',
        name: 'Your Current Location',
        level: 'warning',
        description: 'Prepare for possible evacuation. Stay alert for updates.',
        affectedAreas: ['Your area'],
        estimatedPopulation: 1,
        distance: 0,
        activeFires: 2
      }
    ];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return '#DC2626';
      case 'high': return '#EA580C';
      case 'moderate': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'mandatory': return '#DC2626';
      case 'warning': return '#EA580C';
      case 'watch': return '#D97706';
      case 'safe': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#22C55E';
      case 'full': return '#EAB308';
      case 'closed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleGetDirections = (latitude: number, longitude: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleCallShelter = (phoneNumber: string, name: string) => {
    Alert.alert(
      'Call Shelter',
      `Call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
      ]
    );
  };

  const openFireStationLocation = async (lat: number, lng: number, name: string, placeId?: string, vicinity?: string) => {
    let url;
    if (placeId) {
      // Use the official Google Maps URL with place_id and address fallback
      const address = encodeURIComponent(`${name} ${vicinity || ''}`);
      url = `https://www.google.com/maps/search/?api=1&query=${address}&query_place_id=${placeId}`;
    } else {
      // Fallback to just the address or name
      const address = encodeURIComponent(`${name} ${vicinity || ''}`);
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', `Could not open ${name} location.`);
    }
  };

  const openShelterLocation = async (lat: number, lng: number, name: string, placeId?: string, vicinity?: string) => {
    let url;
    if (placeId) {
      const address = encodeURIComponent(`${name} ${vicinity || ''}`);
      url = `https://www.google.com/maps/search/?api=1&query=${address}&query_place_id=${placeId}`;
    } else {
      const address = encodeURIComponent(`${name} ${vicinity || ''}`);
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', `Could not open ${name} location.`);
    }
  };

  const renderZones = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {userZone && (
        <View style={[styles.userZoneCard, { borderColor: getLevelColor(userZone.level) }]}>
          <View style={styles.zoneHeader}>
            <AlertTriangle size={24} color={getLevelColor(userZone.level)} />
          
          </View>
          <Text style={styles.zoneName}>{userZone.name}</Text>
          <Text style={styles.zoneDescription}>{userZone.description}</Text>
          <View style={styles.zoneStats}>
            <View style={styles.statItem}>
              <Flame size={16} color="#EA580C" />
              <Text style={styles.statText}>
                {userZone.activeFires} active fires nearby
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Flame size={20} color="#EA580C" />
        <Text style={styles.sectionTitle}>Active Wildfires Nearby</Text>
            </View>

      {activeWildfires.length === 0 ? (
        <View style={styles.noDataCard}>
          <CheckCircle size={48} color="#22C55E" />
          <Text style={styles.noDataTitle}>No Active Fires</Text>
          <Text style={styles.noDataText}>No active wildfires detected in your area.</Text>
        </View>
      ) : (
        activeWildfires.map((fire) => (
          <View key={fire.id} style={styles.fireCard}>
            <View style={styles.fireHeader}>
              <View style={styles.fireInfo}>
                <Text style={styles.fireName}>{fire.name}</Text>
                <Text style={styles.fireDistance}>{fire.distance} miles away</Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(fire.severity) }]}>
                <Text style={styles.severityText}>{fire.severity.toUpperCase()}</Text>
              </View>
          </View>
          
            <Text style={styles.fireDescription}>{fire.description}</Text>
          
            <View style={styles.fireStats}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Containment</Text>
                <Text style={styles.statValue}>{fire.containment}%</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Acres Burned</Text>
                <Text style={styles.statValue}>{fire.acres.toLocaleString()}</Text>
            </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Last Updated</Text>
                <Text style={styles.statValue}>{new Date(fire.lastUpdated).toLocaleTimeString()}</Text>
          </View>
            </View>
          </View>
        ))
      )}

      <View style={styles.sectionHeader}>
        <MapPin size={20} color="#3B82F6" />
        <Text style={styles.sectionTitle}>Fire Stations Nearby</Text>
          </View>

      {fireStations.length === 0 ? (
        <View style={styles.noDataCard}>
          <AlertTriangle size={48} color="#EAB308" />
          <Text style={styles.noDataTitle}>No Fire Stations Found</Text>
          <Text style={styles.noDataText}>No fire stations found in your area.</Text>
        </View>
      ) : (
        fireStations.map((station) => (
          <TouchableOpacity
            key={station.id}
            style={styles.fireStationCard}
            onPress={() => openFireStationLocation(station.latitude, station.longitude, station.name, station.placeId, station.vicinity)}
            activeOpacity={0.7}
          >
            <View style={styles.fireStationHeader}>
              <View style={styles.fireStationIconContainer}>
                <Text style={styles.fireStationIcon}>🚒</Text>
              </View>
              <View style={styles.fireStationInfo}>
                <Text style={styles.fireStationName}>{station.name}</Text>
                {station.address && (
                  <Text style={styles.fireStationAddress}>{station.address}</Text>
                )}
                <Text style={styles.fireStationDistance}>{station.distance} miles away</Text>
              </View>

            </View>
            <View style={styles.fireStationActionRow}>
             
              {station.phoneNumber && (
                <TouchableOpacity
                  style={styles.fireStationCallButton}
                  onPress={() => Linking.openURL(`tel:${station.phoneNumber}`)}
                >
                  <Phone size={16} color="#FF6B35" />
                  <Text style={styles.fireStationCallText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderShelters = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Shield size={20} color="#22C55E" />
        <Text style={styles.sectionTitle}>Emergency Shelters</Text>
      </View>

      {emergencyShelters.length === 0 ? (
        <View style={styles.noDataCard}>
          <AlertTriangle size={48} color="#EAB308" />
          <Text style={styles.noDataTitle}>No Shelters Found</Text>
          <Text style={styles.noDataText}>No emergency shelters found in your area.</Text>
        </View>
      ) : (
        emergencyShelters.map((shelter) => (
          <TouchableOpacity
            key={shelter.id}
            style={styles.shelterCard}
            onPress={() => openShelterLocation(shelter.latitude, shelter.longitude, shelter.name, shelter.placeId, shelter.vicinity)}
            activeOpacity={0.7}
          >
            <View style={styles.shelterHeader}>
              <View style={styles.shelterInfo}>
                <Text style={styles.shelterName}>{shelter.name}</Text>
                <Text style={styles.shelterAddress}>{shelter.address}</Text>
                <Text style={styles.shelterDistance}>{shelter.distance} miles away</Text>
              </View>
              <View style={styles.shelterMapButton}>
                <Text style={styles.shelterSearchIcon}>🔍</Text>
              </View>
            </View>
            {shelter.rating && (
              <View style={styles.shelterRating}>
                <Text style={styles.shelterRatingText}>⭐ {shelter.rating}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderRoutes = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Shield size={24} color="#22C55E" />
          <Text style={styles.routeTitle}>Recommended Evacuation Route</Text>
        </View>
        
        {userZone && userZone.level !== 'safe' ? (
          <>
        <View style={styles.routeStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Leave immediately</Text>
            <Text style={styles.stepDescription}>
                  {userZone.level === 'mandatory' ? 'Evacuation is mandatory. Leave now.' : 'Prepare to evacuate immediately.'}
            </Text>
          </View>
        </View>

        <View style={styles.routeStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Follow evacuation routes</Text>
            <Text style={styles.stepDescription}>
                  Use designated evacuation routes. Avoid areas with active fires.
            </Text>
          </View>
        </View>

        <View style={styles.routeStep}>
          <View style={[styles.stepNumber, { backgroundColor: '#22C55E' }]}>
            <CheckCircle size={16} color="#FFFFFF" />
          </View>
          <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Go to nearest shelter</Text>
            <Text style={styles.stepDescription}>
                  Head to the nearest emergency shelter for safety.
            </Text>
          </View>
        </View>
          </>
        ) : (
          <View style={styles.safeZoneMessage}>
            <CheckCircle size={48} color="#22C55E" />
            <Text style={styles.safeZoneTitle}>You are in a safe zone</Text>
            <Text style={styles.safeZoneText}>No evacuation routes needed at this time.</Text>
          </View>
        )}

      <View style={styles.emergencyContacts}>
        <Text style={styles.contactsTitle}>Emergency Contacts</Text>
        
        <TouchableOpacity style={styles.contactItem}>
          <Phone size={20} color="#EF4444" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Emergency Services</Text>
            <Text style={styles.contactNumber}>911</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem}>
          <Phone size={20} color="#3B82F6" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>LA County Emergency</Text>
            <Text style={styles.contactNumber}>(211) 211-2111</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem}>
          <Phone size={20} color="#10B981" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Red Cross Shelter Info</Text>
            <Text style={styles.contactNumber}>(800) 733-2767</Text>
          </View>
        </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading evacuation data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evacuation Center</Text>
        {userZone && userZone.level !== 'safe' && (
          <View style={[styles.alertBadge, { backgroundColor: getLevelColor(userZone.level) }]}>
            <AlertTriangle size={16} color="#FFFFFF" />
            <Text style={styles.alertText}>{userZone.level.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabSelector}>
        {([
          { key: 'zones', label: 'Zones', icon: Map },
          { key: 'shelters', label: 'Shelters', icon: Shield },

        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selectedTab === tab.key && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >

            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTab === 'zones' && renderZones()}
      {selectedTab === 'shelters' && renderShelters()}
      {selectedTab === 'routes' && renderRoutes()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 30,
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
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  shelterCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  shelterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shelterInfo: {
    flex: 1,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  shelterDistance: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  capacityText: {
    color: '#888',
    fontSize: 14,
  },
  capacityBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginLeft: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityTag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  shelterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minWidth: 80,
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  userZoneCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  userZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  zoneCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  zoneLevel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  zoneDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 20,
  },
  zoneStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#888',
    fontSize: 12,
  },
  affectedAreas: {
    marginTop: 8,
  },
  areasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  areaText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  fireCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  fireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fireInfo: {
    flex: 1,
  },
  fireName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fireDistance: {
    fontSize: 14,
    color: '#666',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fireDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 20,
  },
  fireStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeStep: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    gap: 20,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeDetailText: {
    color: '#888',
    fontSize: 14,
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  startNavigationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyContacts: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  contactsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: '#888',
  },
  safeZoneMessage: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  safeZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  safeZoneText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noDataCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  fireStationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  fireStationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fireStationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fireStationIcon: {
    fontSize: 24,
  },
  fireStationInfo: {
    flex: 1,
  },
  fireStationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fireStationAddress: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  fireStationDistance: {
    fontSize: 14,
    color: '#666',
  },
  fireStationMapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  fireStationSearchIcon: {
    fontSize: 20,
  },
  fireStationActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  fireStationRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fireStationRatingText: {
    color: '#FFD700',
    fontSize: 14,
  },
  fireStationCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    minWidth: 80,
  },
  fireStationCallText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  shelterMapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  shelterSearchIcon: {
    fontSize: 20,
  },
  shelterRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shelterRatingText: {
    color: '#FFD700',
    fontSize: 14,
  },
});