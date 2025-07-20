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
} from 'react-native';
import { MapPin, Navigation, Clock, Users, Phone, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

interface Shelter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupied: number;
  status: 'open' | 'full' | 'closed';
  amenities: string[];
  phoneNumber: string;
  distance: number; // in miles
}

interface EvacuationZone {
  id: string;
  name: string;
  level: 'mandatory' | 'warning' | 'watch';
  description: string;
  affectedAreas: string[];
  estimatedPopulation: number;
}

export default function EvacuationScreen() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [evacuationZones, setEvacuationZones] = useState<EvacuationZone[]>([]);
  const [selectedTab, setSelectedTab] = useState<'shelters' | 'zones' | 'routes'>('shelters');
  const [userZone, setUserZone] = useState<EvacuationZone | null>(null);

  useEffect(() => {
    loadEvacuationData();
  }, []);

  const loadEvacuationData = async () => {
    // Simulate API call to emergency services
    const mockShelters: Shelter[] = [
      {
        id: '1',
        name: 'Santa Monica Civic Center',
        address: '1855 Main St, Santa Monica, CA 90401',
        latitude: 34.0195,
        longitude: -118.4912,
        capacity: 500,
        occupied: 287,
        status: 'open',
        amenities: ['Pet Friendly', 'Medical Support', 'Food Service', 'WiFi'],
        phoneNumber: '(310) 458-8411',
        distance: 2.3,
      },
      {
        id: '2',
        name: 'UCLA Pauley Pavilion',
        address: '301 Westwood Plaza, Los Angeles, CA 90095',
        latitude: 34.0722,
        longitude: -118.4441,
        capacity: 1000,
        occupied: 892,
        status: 'open',
        amenities: ['Pet Friendly', 'Medical Support', 'Food Service', 'Showers'],
        phoneNumber: '(310) 825-2101',
        distance: 5.7,
      },
      {
        id: '3',
        name: 'Malibu High School',
        address: '30215 Morning View Dr, Malibu, CA 90265',
        latitude: 34.0259,
        longitude: -118.6847,
        capacity: 300,
        occupied: 300,
        status: 'full',
        amenities: ['Pet Friendly', 'Food Service'],
        phoneNumber: '(310) 456-6621',
        distance: 8.2,
      },
    ];

    const mockZones: EvacuationZone[] = [
      {
        id: '1',
        name: 'Pacific Palisades',
        level: 'mandatory',
        description: 'Immediate evacuation required due to approaching wildfire.',
        affectedAreas: ['Palisades Village', 'Riviera', 'Highlands'],
        estimatedPopulation: 25000,
      },
      {
        id: '2',
        name: 'Malibu Canyon',
        level: 'warning',
        description: 'Prepare for possible evacuation. Stay alert for updates.',
        affectedAreas: ['Malibu Canyon', 'Las Flores Canyon'],
        estimatedPopulation: 8500,
      },
      {
        id: '3',
        name: 'Topanga',
        level: 'watch',
        description: 'Monitor conditions closely. Be ready to evacuate if ordered.',
        affectedAreas: ['Topanga Canyon', 'Fernwood'],
        estimatedPopulation: 12000,
      },
    ];

    setShelters(mockShelters);
    setEvacuationZones(mockZones);
    setUserZone(mockZones[0]); // Simulate user being in mandatory evacuation zone
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#22C55E';
      case 'full': return '#EAB308';
      case 'closed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'mandatory': return '#DC2626';
      case 'warning': return '#EA580C';
      case 'watch': return '#D97706';
      default: return '#6B7280';
    }
  };

  const handleGetDirections = (shelter: Shelter) => {
    Alert.alert(
      'Navigation',
      `Get directions to ${shelter.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Navigate', onPress: () => console.log('Opening navigation...') },
      ]
    );
  };

  const renderShelters = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {shelters.map((shelter) => (
        <View key={shelter.id} style={styles.shelterCard}>
          <View style={styles.shelterHeader}>
            <View style={styles.shelterInfo}>
              <Text style={styles.shelterName}>{shelter.name}</Text>
              <Text style={styles.shelterAddress}>{shelter.address}</Text>
              <Text style={styles.shelterDistance}>{shelter.distance} miles away</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shelter.status) }]}>
              <Text style={styles.statusText}>{shelter.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.capacityInfo}>
            <Users size={16} color="#888" />
            <Text style={styles.capacityText}>
              {shelter.occupied}/{shelter.capacity} occupied
            </Text>
            <View style={styles.capacityBar}>
              <View 
                style={[
                  styles.capacityFill, 
                  { 
                    width: `${(shelter.occupied / shelter.capacity) * 100}%`,
                    backgroundColor: shelter.status === 'full' ? '#EAB308' : '#22C55E'
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.amenitiesContainer}>
            {shelter.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.shelterActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleGetDirections(shelter)}
              disabled={shelter.status === 'closed'}
            >
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Phone size={16} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderZones = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {userZone && (
        <View style={[styles.userZoneCard, { borderColor: getLevelColor(userZone.level) }]}>
          <View style={styles.zoneHeader}>
            <AlertTriangle size={24} color={getLevelColor(userZone.level)} />
            <Text style={styles.userZoneTitle}>Your Current Zone</Text>
          </View>
          <Text style={[styles.zoneLevel, { color: getLevelColor(userZone.level) }]}>
            {userZone.level.toUpperCase()} EVACUATION
          </Text>
          <Text style={styles.zoneName}>{userZone.name}</Text>
          <Text style={styles.zoneDescription}>{userZone.description}</Text>
        </View>
      )}

      {evacuationZones.map((zone) => (
        <View key={zone.id} style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View style={styles.zoneInfo}>
              <Text style={styles.zoneName}>{zone.name}</Text>
              <Text style={[styles.zoneLevel, { color: getLevelColor(zone.level) }]}>
                {zone.level.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.levelIndicator, { backgroundColor: getLevelColor(zone.level) }]} />
          </View>
          
          <Text style={styles.zoneDescription}>{zone.description}</Text>
          
          <View style={styles.zoneStats}>
            <View style={styles.statItem}>
              <Users size={16} color="#888" />
              <Text style={styles.statText}>
                ~{zone.estimatedPopulation.toLocaleString()} people
              </Text>
            </View>
            <View style={styles.statItem}>
              <MapPin size={16} color="#888" />
              <Text style={styles.statText}>
                {zone.affectedAreas.length} areas affected
              </Text>
            </View>
          </View>
          
          <View style={styles.affectedAreas}>
            <Text style={styles.areasTitle}>Affected Areas:</Text>
            {zone.affectedAreas.map((area, index) => (
              <Text key={index} style={styles.areaText}>• {area}</Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderRoutes = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Shield size={24} color="#22C55E" />
          <Text style={styles.routeTitle}>Recommended Evacuation Route</Text>
        </View>
        
        <View style={styles.routeStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Head East on Pacific Coast Highway</Text>
            <Text style={styles.stepDescription}>
              Continue for 2.3 miles. Avoid Malibu Canyon Road (closed).
            </Text>
          </View>
        </View>

        <View style={styles.routeStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Turn North on 4th Street</Text>
            <Text style={styles.stepDescription}>
              Follow signs to Santa Monica Civic Center.
            </Text>
          </View>
        </View>

        <View style={styles.routeStep}>
          <View style={[styles.stepNumber, { backgroundColor: '#22C55E' }]}>
            <CheckCircle size={16} color="#FFFFFF" />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Arrive at Safe Zone</Text>
            <Text style={styles.stepDescription}>
              Santa Monica Civic Center - 1855 Main St
            </Text>
          </View>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routeDetail}>
            <Clock size={16} color="#888" />
            <Text style={styles.routeDetailText}>15-20 min estimated</Text>
          </View>
          <View style={styles.routeDetail}>
            <MapPin size={16} color="#888" />
            <Text style={styles.routeDetailText}>7.2 miles total</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startNavigationButton}>
          <Navigation size={20} color="#FFFFFF" />
          <Text style={styles.startNavigationText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evacuation Center</Text>
        {userZone && (
          <View style={[styles.alertBadge, { backgroundColor: getLevelColor(userZone.level) }]}>
            <AlertTriangle size={16} color="#FFFFFF" />
            <Text style={styles.alertText}>{userZone.level.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabSelector}>
        {([
          { key: 'shelters', label: 'Shelters' },
          { key: 'zones', label: 'Zones' },
          { key: 'routes', label: 'Routes' },
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

      {selectedTab === 'shelters' && renderShelters()}
      {selectedTab === 'zones' && renderZones()}
      {selectedTab === 'routes' && renderRoutes()}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 16,
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
});