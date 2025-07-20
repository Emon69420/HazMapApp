import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { TriangleAlert as AlertTriangle, Flame, Shield, Navigation, RefreshCw, Eye, EyeOff } from 'lucide-react-native';

interface WildfireData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  containment: number;
  acres: number;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  coordinates: Array<{ latitude: number; longitude: number }>;
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [wildfires, setWildfires] = useState<WildfireData[]>([]);
  const [selectedFire, setSelectedFire] = useState<WildfireData | null>(null);
  const [mapLayers, setMapLayers] = useState({
    fires: true,
    evacuation: true,
    hazards: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();

    loadWildfireData();
  }, []);

  const loadWildfireData = async () => {
    setIsLoading(true);
    // Simulate API call to NASA FIRMS or other wildfire data sources
    setTimeout(() => {
      const mockData: WildfireData[] = [
        {
          id: '1',
          name: 'Palisades Fire',
          latitude: 34.0522,
          longitude: -118.2437,
          containment: 23,
          acres: 15420,
          severity: 'extreme',
          coordinates: [
            { latitude: 34.0522, longitude: -118.2537 },
            { latitude: 34.0622, longitude: -118.2337 },
            { latitude: 34.0422, longitude: -118.2337 },
            { latitude: 34.0422, longitude: -118.2537 },
          ],
        },
        {
          id: '2',
          name: 'Angeles Fire',
          latitude: 34.1022,
          longitude: -118.1937,
          containment: 67,
          acres: 8930,
          severity: 'moderate',
          coordinates: [
            { latitude: 34.1022, longitude: -118.2037 },
            { latitude: 34.1122, longitude: -118.1837 },
            { latitude: 34.0922, longitude: -118.1837 },
            { latitude: 34.0922, longitude: -118.2037 },
          ],
        },
      ];
      setWildfires(mockData);
      setIsLoading(false);
    }, 1000);
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

  const toggleLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Wildfire Map</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadWildfireData}
          disabled={isLoading}
        >
          <RefreshCw size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <View style={styles.layerControls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.layerButton, mapLayers.fires && styles.layerButtonActive]}
            onPress={() => toggleLayer('fires')}
          >
            {mapLayers.fires ? <Eye size={16} color="#FFFFFF" /> : <EyeOff size={16} color="#666" />}
            <Text style={[styles.layerText, mapLayers.fires && styles.layerTextActive]}>
              Fires
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.layerButton, mapLayers.evacuation && styles.layerButtonActive]}
            onPress={() => toggleLayer('evacuation')}
          >
            {mapLayers.evacuation ? <Eye size={16} color="#FFFFFF" /> : <EyeOff size={16} color="#666" />}
            <Text style={[styles.layerText, mapLayers.evacuation && styles.layerTextActive]}>
              Evacuation
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.layerButton, mapLayers.hazards && styles.layerButtonActive]}
            onPress={() => toggleLayer('hazards')}
          >
            {mapLayers.hazards ? <Eye size={16} color="#FFFFFF" /> : <EyeOff size={16} color="#666" />}
            <Text style={[styles.layerText, mapLayers.hazards && styles.layerTextActive]}>
              Hazards
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Interactive Map Loading...</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Wildfire data will be displayed here with real-time updates
          </Text>
          
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Your Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          <ScrollView style={styles.firesList} showsVerticalScrollIndicator={false}>
            {wildfires.map((fire) => (
              <TouchableOpacity
                key={fire.id}
                style={[styles.fireItem, selectedFire?.id === fire.id && styles.fireItemSelected]}
                onPress={() => setSelectedFire(fire)}
              >
                <View style={styles.fireHeader}>
                  <View style={[styles.fireMarker, { backgroundColor: getSeverityColor(fire.severity) }]}>
                    <Flame size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.fireInfo}>
                    <Text style={styles.fireName}>{fire.name}</Text>
                    <Text style={styles.fireStats}>
                      {fire.acres.toLocaleString()} acres • {fire.containment}% contained
                    </Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(fire.severity) }]}>
                    <Text style={styles.severityText}>{fire.severity.toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedFire && (
          <View style={styles.fireDetails}>
            <View style={styles.fireDetailsHeader}>
              <View style={styles.fireDetailsInfo}>
                <Text style={styles.fireDetailsName}>{selectedFire.name}</Text>
                <Text style={styles.fireDetailsStats}>
                  {selectedFire.acres.toLocaleString()} acres • {selectedFire.containment}% contained
                </Text>
              </View>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedFire.severity) }]}>
                <Text style={styles.severityText}>{selectedFire.severity.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.fireActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Shield size={16} color="#22C55E" />
                <Text style={styles.actionText}>Evacuation Info</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Navigation size={16} color="#3B82F6" />
                <Text style={styles.actionText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.alertBanner}>
        <AlertTriangle size={20} color="#FFD23F" />
        <Text style={styles.alertText}>
          {wildfires.length} active fires in your area. Stay alert and follow evacuation orders.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  layerControls: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  layerButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  layerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  layerTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  locationInfo: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  firesList: {
    width: '100%',
    maxHeight: 200,
  },
  fireItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  fireItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#2A1A1A',
  },
  fireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fireInfo: {
    flex: 1,
  },
  fireName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  fireStats: {
    fontSize: 12,
    color: '#888',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fireDetails: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  fireDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fireDetailsInfo: {
    flex: 1,
  },
  fireDetailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fireDetailsStats: {
    fontSize: 14,
    color: '#888',
  },
  fireActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  alertText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});