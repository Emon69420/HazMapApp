import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Wind, Thermometer, Eye, Droplets, CircleAlert as AlertCircle, MapPin } from 'lucide-react-native';
import { useLocation } from '../../LocationContext';
import * as ExpoLocation from 'expo-location';

interface AirQualityData {
  aqi: number;
  category: string;
  primaryPollutant: string;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  location: string;
  timestamp?: string;
  pollutantsArray: any[]; // Added for new structure
  healthRecommendations?: { [key: string]: string };
}

// Add this dictionary above the AirQualityScreen function
const POLLUTANT_INFO: Record<string, { name: string; harmful: string; made: string; reduce: string; wildfireContribution: string }> = {
  pm25: {
    name: 'PM2.5',
    harmful: 'Fine particulate matter (PM2.5) can penetrate deep into the lungs and even enter the bloodstream, causing respiratory and cardiovascular problems, and is linked to premature death.',
    made: 'PM2.5 is produced by combustion (vehicles, wildfires, power plants), industrial processes, and chemical reactions in the atmosphere.',
    reduce: 'Reduce vehicle use, avoid burning trash, use cleaner fuels, support clean energy, and avoid outdoor activity during high PM2.5 alerts.',
    wildfireContribution: 'High levels of PM2.5 in the air can indicate dry, dusty, and flammable conditions, which increase wildfire risk. Activities that generate PM2.5, such as burning trash or debris, can also directly start fires.'
  },
  pm10: {
    name: 'PM10',
    harmful: 'Inhalable particulate matter (PM10) can cause respiratory irritation, worsen asthma, and increase the risk of lung disease.',
    made: 'PM10 comes from dust, construction, road traffic, agriculture, and burning of fossil fuels.',
    reduce: 'Control dust, use cleaner vehicles, support green spaces, and avoid outdoor activity during high PM10 alerts.',
    wildfireContribution: 'Sources of PM10, such as land clearing, construction, and agricultural burning, can dry out vegetation and soil, making areas more susceptible to wildfires.'
  },
  o3: {
    name: 'Ozone (O₃)',
    harmful: 'Ground-level ozone irritates the airways, aggravates asthma, and can reduce lung function.',
    made: 'Ozone is formed by chemical reactions between NOx and VOCs in sunlight, mainly from vehicles and industry.',
    reduce: 'Reduce car trips, avoid refueling during hot days, use public transport, and support clean air policies.',
    wildfireContribution: 'Ozone itself does not cause wildfires, but the chemical reactions that produce ozone (involving VOCs and NOx) are often linked to human activities that can also increase wildfire risk, such as industrial emissions and vehicle use.'
  },
  no2: {
    name: 'Nitrogen Dioxide (NO₂)',
    harmful: 'NO₂ irritates airways, worsens asthma, and increases susceptibility to respiratory infections.',
    made: 'NO₂ is mainly produced by vehicle exhaust, power plants, and industrial emissions.',
    reduce: 'Use cleaner vehicles, reduce fossil fuel use, and support emission controls.',
    wildfireContribution: 'NO₂ is a marker of combustion. Activities that emit NO₂, such as burning fossil fuels or biomass, can also spark or worsen wildfires.'
  },
  so2: {
    name: 'Sulfur Dioxide (SO₂)',
    harmful: 'SO₂ can cause respiratory problems, aggravate asthma, and contribute to the formation of acid rain.',
    made: 'SO₂ is produced by burning coal and oil, industrial processes, and volcanoes.',
    reduce: 'Use cleaner energy sources, support emission controls, and avoid outdoor activity during high SO₂ alerts.',
    wildfireContribution: 'SO₂ is not a direct cause of wildfires, but industrial activities that emit SO₂ may also involve heat or sparks that can ignite fires in dry conditions.'
  },
  co: {
    name: 'Carbon Monoxide (CO)',
    harmful: 'CO reduces oxygen delivery in the body, causing headaches, dizziness, and at high levels, can be fatal.',
    made: 'CO is produced by incomplete combustion of fossil fuels, especially from vehicles and generators.',
    reduce: 'Maintain vehicles, avoid idling, use proper ventilation, and avoid using gas appliances indoors.',
    wildfireContribution: 'CO is a byproduct of burning. Activities that produce CO, such as campfires, grilling, or burning waste, can directly start wildfires if not properly managed.'
  },
};

export default function AirQualityScreen() {
  // All hooks at the top!
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | '24h' | '7d'>('current');
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [ngos, setNgos] = useState<any[]>([]);
  const [ngosLoading, setNgosLoading] = useState(false);
  const [selectedPollutant, setSelectedPollutant] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [ngosType, setNgosType] = useState<'tree-planting' | 'alternative'>('tree-planting');
  const { location: sharedLocation } = useLocation();
  console.log('AirQualityScreen render, sharedLocation:', sharedLocation);
  const GOOGLE_API_KEY = 'API_KEY_HERE';
  const apiKey = GOOGLE_API_KEY;

  // Declare lat/lng after hooks
  // const lat = sharedLocation?.latitude || 34.0522;
  // const lng = sharedLocation?.longitude || -118.2437;

  // Add a combined fetch function
  const fetchAirQualityAndNgos = async (lat: number, lng: number) => {
    console.log('Fetching AQI and NGOs for lat/lng:', lat, lng);
    await fetchAirQualityData('current', lat, lng);
    setNgosLoading(true);
    
    // First try to find tree planting NGOs
    try {
      const treePlantingUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&keyword=tree%20planting%20ngo&type=establishment&key=${apiKey}`;
      console.log('Google Places Tree Planting NGO API request URL:', treePlantingUrl);
      const treePlantingResponse = await fetch(treePlantingUrl);
      const treePlantingData = await treePlantingResponse.json();
      console.log('Google Places Tree Planting NGO API response:', treePlantingData);
      
      if (treePlantingData.results && treePlantingData.results.length > 0) {
        setNgos(treePlantingData.results);
        setNgosType('tree-planting');
      } else {
        // If no tree planting NGOs found, search for alternative NGOs
        const alternativeKeywords = [
          'sustainability ngo',
          'environmental organization',
          'social good ngo',
          'climate action',
          'conservation organization',
          'green initiative'
        ];
        
        let alternativeNgos: any[] = [];
        
        for (const keyword of alternativeKeywords) {
          try {
            const alternativeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=15000&keyword=${encodeURIComponent(keyword)}&type=establishment&key=${apiKey}`;
            console.log(`Google Places Alternative NGO API request URL (${keyword}):`, alternativeUrl);
            const alternativeResponse = await fetch(alternativeUrl);
            const alternativeData = await alternativeResponse.json();
            console.log(`Google Places Alternative NGO API response (${keyword}):`, alternativeData);
            
            if (alternativeData.results && alternativeData.results.length > 0) {
              // Add unique NGOs (avoid duplicates)
              alternativeData.results.forEach((ngo: any) => {
                if (!alternativeNgos.find(existing => existing.place_id === ngo.place_id)) {
                  alternativeNgos.push(ngo);
                }
              });
            }
          } catch (e) {
            console.error(`Error fetching ${keyword} NGOs:`, e);
          }
        }
        
        // Limit to top 5 alternative NGOs
        alternativeNgos = alternativeNgos.slice(0, 5);
        setNgos(alternativeNgos);
        setNgosType('alternative');
      }
    } catch (e) {
      console.error('Error fetching NGOs:', e);
      setNgos([]);
      setNgosType('tree-planting');
    }
    setNgosLoading(false);
  };

  const loadAirQualityData = async () => {
    setIsLoading(true);
    // Simulate API call to Google Maps Air Quality API
    setTimeout(() => {
      const mockData: AirQualityData = {
        aqi: 156,
        category: 'Unhealthy',
        primaryPollutant: 'PM2.5',
        pollutants: {
          pm25: 65.4,
          pm10: 89.2,
          o3: 45.1,
          no2: 23.8,
          so2: 12.3,
          co: 1.2,
        },
        location: 'Los Angeles, CA',
        timestamp: new Date().toISOString(),
        pollutantsArray: [], // Mock data for new structure
      };
      setAirQuality(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const fetchAirQualityData = async (timeframe: 'current' | '24h' | '7d', lat: number, lng: number) => {
    let locationName = '';
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const geoRes = await fetch(geocodeUrl);
      const geoJson = await geoRes.json();
      const components = geoJson.results?.[0]?.address_components || [];
      locationName =
        components.find((c: any) => c.types.includes('locality'))?.long_name ||
        components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ||
        components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name ||
        components.find((c: any) => c.types.includes('country'))?.long_name ||
        '';
    } catch {}
    if (timeframe === 'current') {
      // Current air quality
      const res = await fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng },
          languageCode: 'en',
          universalAqi: true,
          extraComputations: [
            'POLLUTANT_CONCENTRATION',
            'POLLUTANT_ADDITIONAL_INFO',
          ],
        }),
      });
      const json = await res.json();
      console.log('Current Air Quality API response:', json);
      const aqiObj = json?.indexes?.[0];
      const pollutants = json?.pollutants || [];
      setAirQuality({
        aqi: aqiObj?.aqi ?? 0,
        category: aqiObj?.category ?? 'Good',
        primaryPollutant: aqiObj?.dominantPollutant ?? '',
        pollutants: {
          pm25: pollutants.find((p: any) => p.code === 'pm25' || p.code === 'PM2.5')?.concentration?.value ?? 0,
          pm10: pollutants.find((p: any) => p.code === 'pm10' || p.code === 'PM10')?.concentration?.value ?? 0,
          o3: pollutants.find((p: any) => p.code === 'o3' || p.code === 'O3')?.concentration?.value ?? 0,
          no2: pollutants.find((p: any) => p.code === 'no2' || p.code === 'NO2')?.concentration?.value ?? 0,
          so2: pollutants.find((p: any) => p.code === 'so2' || p.code === 'SO2')?.concentration?.value ?? 0,
          co: pollutants.find((p: any) => p.code === 'co' || p.code === 'CO')?.concentration?.value ?? 0,
        },
        location: locationName,
        timestamp: json?.dateTime || new Date().toISOString(),
        pollutantsArray: json.pollutants || [],
        healthRecommendations: aqiObj?.healthRecommendations || undefined,
      });
    } else {
      // 24h or 7d forecast
      const airBody = {
        location: { latitude: lat, longitude: lng },
        extraComputations: [
          'POLLUTANT_CONCENTRATION',
          'POLLUTANT_ADDITIONAL_INFO',
        ],
        languageCode: 'en',
        universalAqi: true
      };
      const res = await fetch(`https://airquality.googleapis.com/v1/forecast:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(airBody),
      });
      const json = await res.json();
      console.log('Forecast Air Quality API response:', json);
      const hours = json?.hourlyForecasts || [];
      let count = 0;
      let aqiSum = 0;
      let pm25Sum = 0, pm25Count = 0, pm10Sum = 0, pm10Count = 0, o3Sum = 0, o3Count = 0, no2Sum = 0, no2Count = 0, so2Sum = 0, so2Count = 0, coSum = 0, coCount = 0;
      let primaryPollutant = '';
      let category = '';
      let regionCode = json?.regionCode || '';
      let timestamp = hours[0]?.dateTime || new Date().toISOString();
      let n = hours.length;
      let limit = timeframe === '24h' ? 24 : 24 * 7;
      let allPollutants: any[] = [];
      for (let i = 0; i < Math.min(n, limit); ++i) {
        const h = hours[i];
        const aqiObj = h?.indexes?.[0];
        aqiSum += aqiObj?.aqi ?? 0;
        category = aqiObj?.category ?? category;
        primaryPollutant = aqiObj?.dominantPollutant ?? primaryPollutant;
        if (h?.pollutants) allPollutants = allPollutants.concat(h.pollutants);
      }
      setAirQuality({
        aqi: count ? Math.round(aqiSum / count) : 0,
        category: category || 'Good',
        primaryPollutant: primaryPollutant || '',
        pollutants: {
          pm25: pm25Count ? +(pm25Sum / pm25Count).toFixed(1) : 0,
          pm10: pm10Count ? +(pm10Sum / pm10Count).toFixed(1) : 0,
          o3: o3Count ? +(o3Sum / o3Count).toFixed(1) : 0,
          no2: no2Count ? +(no2Sum / no2Count).toFixed(1) : 0,
          so2: so2Count ? +(so2Sum / so2Count).toFixed(1) : 0,
          co: coCount ? +(coSum / coCount).toFixed(1) : 0,
        },
        location: locationName,
        timestamp,
        pollutantsArray: allPollutants,
      });
    }
  };

  const getCurrentLatLng = async () => {
    let lat = sharedLocation?.latitude || 34.0522;
    let lng = sharedLocation?.longitude || -118.2437;
    if (!sharedLocation) {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await ExpoLocation.getCurrentPositionAsync({});
          lat = currentLocation.coords.latitude;
          lng = currentLocation.coords.longitude;
        }
      } catch {}
    }
    return { lat, lng };
  };

  // Only use the effect that loads both AQI and NGOs
  useEffect(() => {
    console.log('useEffect triggered, sharedLocation:', sharedLocation);
    if (sharedLocation?.latitude && sharedLocation?.longitude) {
      fetchAirQualityAndNgos(sharedLocation.latitude, sharedLocation.longitude);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [sharedLocation]);

  const getAQIColor = (aqi: number) => {
    if (aqi >= 80) return '#22C55E'; // Excellent/Good (Green)
    if (aqi >= 60) return '#A855F7'; // Moderate (Purple)
    if (aqi >= 40) return '#EAB308'; // Poor (Yellow)
    if (aqi >= 20) return '#F97316'; // Very Poor (Orange)
    return '#EF4444'; // Hazardous (Red)
  };

  const getHealthRecommendation = (category: string) => {
    switch (category) {
      case 'Good':
        return 'Air quality is considered satisfactory. Ideal time for outdoor activities.';
      case 'Moderate':
        return 'Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor activities.';
      case 'Unhealthy for Sensitive':
        return 'Sensitive groups may experience health effects. Limit prolonged outdoor activities if you have heart or lung disease.';
      case 'Unhealthy':
        return 'Everyone may experience health effects. Avoid prolonged outdoor activities. Stay indoors if possible.';
      case 'Very Unhealthy':
        return 'Health alert! Everyone should avoid outdoor activities. Keep windows closed and use air purifiers.';
      case 'Hazardous':
        return 'Emergency conditions. Everyone should remain indoors and avoid all outdoor activities.';
      default:
        return 'Monitor air quality regularly and follow health recommendations.';
    }
  };

  // Reverse the color logic for pollutant levels
  const getPollutantLevel = (value: number, type: string) => {
    // Now: lower = red, higher = green
    if (value <= 12) return { level: 'Low', color: '#EF4444' }; // Red for low
    if (value <= 35) return { level: 'Moderate', color: '#F97316' }; // Orange
    if (value <= 55) return { level: 'High', color: '#EAB308' }; // Yellow
    return { level: 'Very High', color: '#22C55E' }; // Green for high
  };

  const formatUnits = (units: string | undefined) => {
    if (units === 'MICROGRAMS_PER_CUBIC_METER') return 'μg/m³';
    if (units === 'MILLIGRAMS_PER_CUBIC_METER') return 'mg/m³';
    if (units === 'PARTS_PER_BILLION') return 'ppb';
    return units || '';
  };

  // Remove fetchHealthRecommendation and related useEffect

  if (!sharedLocation || !airQuality) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>
          {!sharedLocation ? 'Getting your location...' : 'Loading air quality data...'}
        </Text>
      </SafeAreaView>
    );
  }

  const pollutantsArray = airQuality?.pollutantsArray || [];
  const POLLUTANT_CODES = [
    { code: 'pm25', label: 'PM2.5', units: 'MICROGRAMS_PER_CUBIC_METER' },
    { code: 'pm10', label: 'PM10', units: 'MILLIGRAMS_PER_CUBIC_METER' },
    { code: 'o3', label: 'O₃', units: 'PARTS_PER_BILLION' },
    { code: 'no2', label: 'NO₂', units: 'PARTS_PER_BILLION' },
    { code: 'so2', label: 'SO₂', units: 'PARTS_PER_BILLION' },
    { code: 'co', label: 'CO', units: 'PARTS_PER_BILLION' },
  ];
  const pollutantBreakdown = POLLUTANT_CODES.map(({ code, label, units }) => {
    const pollutant = pollutantsArray.find((p: any) => p.code === code);
    return {
      code,
      label,
      value: pollutant?.concentration?.value ?? '--',
      units: formatUnits(pollutant?.concentration?.units ?? units),
    };
  });

  const openNgoLocation = async (lat: number, lng: number, name: string, placeId?: string, vicinity?: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Reloading...</Text>
        </View>
      )}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Air Quality</Text>
          <Text style={styles.location}>{airQuality.location}</Text>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.aqiContainer}>
            <View style={[styles.aqiCircle, { borderColor: getAQIColor(airQuality.aqi) }]}>
              <Text style={[styles.aqiNumber, { color: getAQIColor(airQuality.aqi) }]}>
                {airQuality.aqi}
              </Text>
            </View>
            <View style={styles.aqiInfo}>
              <Text style={[styles.aqiCategory, { color: getAQIColor(airQuality.aqi) }]}>
                {airQuality.category}
              </Text>
              <Text style={styles.primaryPollutant}>
                Primary: {airQuality.primaryPollutant}
              </Text>
            </View>
          </View>

          <View style={styles.healthAlert}>
            <AlertCircle size={20} color={getAQIColor(airQuality.aqi)} />
            <Text style={styles.healthText}>
              Sudden drastic changes in AQI and pollutant concentration may indicate fire or wildfire nearby.
            </Text>
          </View>
        </View>

        <View style={styles.pollutantsSection}>
          <Text style={styles.sectionTitle}>Pollutant Breakdown</Text>
          <View style={styles.pollutantGrid}>
            {pollutantBreakdown.map(p => (
              <TouchableOpacity
                key={p.code}
                style={styles.pollutantCard}
                onPress={() => {
                  setSelectedPollutant(p.code);
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pollutantName}>{p.label}</Text>
                <Text style={styles.pollutantValue}>{p.value} {p.units}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Local Tree-Planting NGOs section - moved under pollutant breakdown */}
        <View style={styles.ngosSection}>
          <Text style={styles.ngosSectionTitle}>
            {ngosType === 'tree-planting' ? 'Local Tree-Planting NGOs' : 'Local Environmental & Social NGOs'}
          </Text>
          {ngosLoading ? (
            <View style={styles.ngoLoadingContainer}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.ngoLoadingText}>Finding local NGOs...</Text>
            </View>
          ) : ngos.length > 0 ? (
            <>
              {ngosType === 'alternative' && (
                <View style={styles.ngoEmptyContainer}>
                  <Text style={styles.ngoEmptyText}>
                    No tree planting NGOs found nearby, but here are some other NGOs that may help:
                  </Text>
                </View>
              )}
              {ngos.map((ngo, idx) => (
                <TouchableOpacity
                  key={ngo.place_id || idx}
                  style={styles.ngoCard}
                  onPress={() => openNgoLocation(ngo.geometry.location.lat, ngo.geometry.location.lng, ngo.name, ngo.place_id, ngo.vicinity)}
                  activeOpacity={0.7}
                >
                  <View style={styles.ngoHeader}>
                    <View style={styles.ngoIconContainer}>
                      <Text style={styles.ngoIcon}>
                        {ngosType === 'tree-planting' ? '🌳' : '🌱'}
                      </Text>
                    </View>
                    <View style={styles.ngoInfo}>
                      <Text style={styles.ngoName}>{ngo.name}</Text>
                      {ngo.vicinity && (
                        <Text style={styles.ngoAddress}>{ngo.vicinity}</Text>
                      )}
                    </View>
                    <View style={styles.ngoMapButton}>
                      <Text style={styles.ngoSearchIcon}>🔍</Text>
                    </View>
                  </View>
                  <View style={styles.ngoActionRow}>
                    <Text style={styles.ngoActionText}>Tap to view place details</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.ngoEmptyContainer}>
              <Text style={styles.ngoEmptyText}>No NGOs found nearby</Text>
            </View>
          )}
        </View>

        {/* Pollutant Info Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={styles.modalContent}>
              <ScrollView style={{width: '100%'}} contentContainerStyle={{paddingBottom: 24}} showsVerticalScrollIndicator={true}>
                <Text style={styles.modalTitle}>
                  {selectedPollutant ? POLLUTANT_INFO[selectedPollutant]?.name : ''}
                </Text>
                <Text style={styles.modalSectionTitle}>Why is this harmful?</Text>
                <Text style={styles.modalText}>
                  {selectedPollutant ? POLLUTANT_INFO[selectedPollutant]?.harmful : ''}
                </Text>
                <Text style={styles.modalSectionTitle}>How is it made?</Text>
                <Text style={styles.modalText}>
                  {selectedPollutant ? POLLUTANT_INFO[selectedPollutant]?.made : ''}
                </Text>
                <Text style={styles.modalSectionTitle}>How to reduce this?</Text>
                <Text style={styles.modalText}>
                  {selectedPollutant ? POLLUTANT_INFO[selectedPollutant]?.reduce : ''}
                </Text>
                <Text style={styles.modalSectionTitle}>Contribution to Wildfires & Fires</Text>
                <Text style={styles.modalText}>
                  {selectedPollutant ? POLLUTANT_INFO[selectedPollutant]?.wildfireContribution : ''}
                </Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {lastUpdated || '--'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButtonTextOnly}
            onPress={async () => {
              setIsLoading(true);
              const { lat, lng } = await getCurrentLatLng();
              await fetchAirQualityData('current', lat, lng);
              setLastUpdated(new Date().toLocaleTimeString());
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <Text style={styles.refreshTextOrange}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#888',
  },
  mainCard: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  aqiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aqiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  aqiNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  aqiInfo: {
    flex: 1,
  },
  aqiCategory: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  primaryPollutant: {
    fontSize: 16,
    color: '#888',
  },
  healthAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  healthText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  timeframeSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  timeframeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
  },
  pollutantsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pollutantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pollutantCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: '#333',
  },
  pollutantName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  pollutantValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pollutantLevel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  recommendationsSection: {
    margin: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  refreshText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
    margin: 20,
    marginTop: 0,
    elevation: 4,
  },
  refreshButtonTextOnly: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignSelf: 'flex-end',
    margin: 0,
    elevation: 0,
  },
  refreshTextOrange: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  ngosSection: {
    margin: 20,
    marginTop: 0,
  },
  ngosSectionTitle: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
  },
  ngoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ngoLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ngoLoadingText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginLeft: 8,
  },
  ngoEmptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ngoEmptyText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  ngoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ngoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ngoIcon: {
    fontSize: 24,
  },
  ngoSearchIcon: {
    fontSize: 24,
  },
  ngoInfo: {
    flex: 1,
  },
  ngoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ngoAddress: {
    fontSize: 13,
    color: '#888',
  },
  ngoContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ngoContactLabel: {
    fontSize: 13,
    color: '#888',
    marginRight: 8,
  },
  ngoContactValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ngoRating: {
    marginTop: 8,
  },
  ngoRatingText: {
    fontSize: 13,
    color: '#888',
  },
  ngoMapButton: {
    marginLeft: 10,
  },
  ngoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  ngoActionText: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    margin: 2,
    width: '99%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    padding: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});