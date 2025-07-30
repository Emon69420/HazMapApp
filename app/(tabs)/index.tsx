import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import * as Location from 'expo-location';
import { TriangleAlert as AlertTriangle, Flame, Shield, Navigation, RefreshCw, Eye, EyeOff, X, Crosshair } from 'lucide-react-native';
import MapView from 'react-native-maps';
// import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useLocation } from '../../LocationContext';
import LottieView from 'lottie-react-native';

const GOOGLE_API_KEY = 'API_KEY_HERE';

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

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

type PlaceSuggestion = {
  place_id: string;
  description: string;
};

interface EnvData {
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  precipitation: number | null;
  aqi: number | null;
  pm25: number | null;
  elevation: number | null;
  aqiCategory: string | null;
  aqiDisplay: string | null;
  aqiPollutant: string | null;
  aqiName: string | null;
}

export default function MapScreen() {
  const [wildfires, setWildfires] = useState<WildfireData[]>([]);
  const [selectedFire, setSelectedFire] = useState<WildfireData | null>(null);
  const [mapLayers, setMapLayers] = useState({
    fires: true,
    evacuation: true,
    hazards: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [envData, setEnvData] = useState<EnvData>({
    temperature: null,
    windSpeed: null,
    humidity: null,
    precipitation: null,
    aqi: null,
    pm25: null,
    elevation: null,
    aqiCategory: null,
    aqiDisplay: null,
    aqiPollutant: null,
    aqiName: null,
  });
  const { location: sharedLocation, setLocation: setSharedLocation } = useLocation();
  // Add state for wildfire risk prediction after envData
  const [wildfireRisk, setWildfireRisk] = useState<string | null>(null);
  const [wildfireRiskLoading, setWildfireRiskLoading] = useState(false);
  const [wildfireRiskModalVisible, setWildfireRiskModalVisible] = useState(false);
  const [wildfireRiskFullResult, setWildfireRiskFullResult] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Add helper to parse prediction string
  function getParsedPrediction(pred: any) {
    if (typeof pred === 'string') {
      try {
        const clean = pred.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
      } catch {
        return null;
      }
    }
    return pred;
  }

  // Helper to fetch pollutant concentrations (like air-quality.tsx)
  const fetchPollutants = async (lat: number, lng: number) => {
    try {
      const airBody = {
        location: { latitude: lat, longitude: lng },
        languageCode: 'en',
        universalAqi: true,
        extraComputations: [
          'POLLUTANT_CONCENTRATION',
          'POLLUTANT_ADDITIONAL_INFO',
        ],
      };
      const airRes = await fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(airBody),
      });
      const airJson = await airRes.json();
      const pollutants = airJson?.pollutants || [];
      return {
        pm25: pollutants.find((p: any) => p.code === 'pm25' || p.code === 'PM2.5')?.concentration?.value ?? 0,
        pm10: pollutants.find((p: any) => p.code === 'pm10' || p.code === 'PM10')?.concentration?.value ?? 0,
        o3: pollutants.find((p: any) => p.code === 'o3' || p.code === 'O3')?.concentration?.value ?? 0,
        no2: pollutants.find((p: any) => p.code === 'no2' || p.code === 'NO2')?.concentration?.value ?? 0,
        so2: pollutants.find((p: any) => p.code === 'so2' || p.code === 'SO2')?.concentration?.value ?? 0,
        co: pollutants.find((p: any) => p.code === 'co' || p.code === 'CO')?.concentration?.value ?? 0,
        aqi: airJson?.indexes?.[0]?.aqi ?? 0,
      };
    } catch (e) {
      return { pm25: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0, aqi: 0 };
    }
  };

  // Wildfire risk prediction fetcher
  const fetchWildfireRisk = async (lat: number, lng: number, env: EnvData) => {
    setWildfireRiskLoading(true);
    setWildfireRisk(null);
    setWildfireRiskFetched(false);
    // Get pollutant concentrations
    const pol = await fetchPollutants(lat, lng);
    // Compose API query
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      temperature: env.temperature?.toString() ?? '0',
      humidity: env.humidity?.toString() ?? '0',
      precipitation: env.precipitation?.toString() ?? '0',
      windspeed: env.windSpeed?.toString() ?? '0',
      aqi: pol.aqi?.toString() ?? '0',
      elevation: env.elevation?.toString() ?? '0',
      pm25: pol.pm25?.toString() ?? '0',
      pm10: pol.pm10?.toString() ?? '0',
      o3: pol.o3?.toString() ?? '0',
      no2: pol.no2?.toString() ?? '0',
      so2: pol.so2?.toString() ?? '0',
      co: pol.co?.toString() ?? '0',
    });
    const apiUrl = `CUSTOM_API_ENDPOINT_HERE?${params.toString()}`;
    console.log('Wildfire Risk API Query:', apiUrl);
    try {
      const res = await fetch(apiUrl);
      const json = await res.json();
      setWildfireRiskFullResult(json); // Store full result for modal
      let risk = json?.prediction?.prediction || json?.prediction || json?.result?.risk || 'Unknown';
      // Try to extract just the risk string (e.g., Moderate, High, Low)
      if (typeof risk === 'string') {
        const match = risk.match(/"prediction"\s*:\s*"(.*?)"/);
        if (match) risk = match[1];
        else if (risk.startsWith('"') && risk.endsWith('"')) risk = risk.slice(1, -1);
      }
      setWildfireRisk(risk);
      setWildfireRiskFetched(true);
    } catch (e) {
      setWildfireRisk('Unknown');
      setWildfireRiskFullResult(null);
      setWildfireRiskFetched(false);
    }
    setWildfireRiskLoading(false);
  };

  // Call wildfire risk prediction when location changes or recenters
  const updateWildfireRisk = async (lat: number, lng: number, env: EnvData) => {
    await fetchWildfireRisk(lat, lng, env);
  };

  // Refactor fetchEnvData to return the new data
  const fetchEnvData = async (lat: number, lng: number) => {
    // Elevation
    const elevRes = await fetch(`https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_API_KEY}`);
    const elevJson = await elevRes.json();
    const elevation = elevJson.results?.[0]?.elevation ?? null;

    // Air Quality (PM2.5, AQI)
    let aqi = null;
    let pm25 = null;
    let aqiCategory = null;
    let aqiDisplay = null;
    let aqiPollutant = null;
    let aqiName = null;
    try {
      const airBody = {
        location: { latitude: lat, longitude: lng },
        languageCode: 'en',
        universalAqi: true
      };
      const airRes = await fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(airBody),
      });
      const airJson = await airRes.json();
      const aqiObj = airJson?.indexes?.[0];
      aqi = aqiObj?.aqi ?? null;
      aqiDisplay = aqiObj?.aqiDisplay ?? null;
      aqiCategory = aqiObj?.category ?? null;
      aqiPollutant = aqiObj?.dominantPollutant ?? null;
      aqiName = aqiObj?.displayName ?? null;
      pm25 = airJson?.pollutants?.find((p: any) => p.code === 'pm25' || p.code === 'PM2.5')?.concentration?.value ?? null;
    } catch (e) { }

    // Weather (temperature, wind, humidity, precipitation)
    let temperature = null, windSpeed = null, humidity = null, precipitation = null;
    try {
      const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`;
      const weatherRes = await fetch(weatherUrl);
      const weatherText = await weatherRes.text();
      let weatherJson: any = {};
      try {
        weatherJson = JSON.parse(weatherText);
      } catch (e) {}
      console.log('Weather API raw output:', weatherJson); // Log full weatherJson
      const temp = weatherJson?.temperature?.degrees ?? null;
      const wind = weatherJson?.wind?.speed?.value ?? null;
      const humid = weatherJson?.relativeHumidity ?? null;
      // Precipitation: use probability.percent if available, else qpf.quantity
      let precip = null;
      if (weatherJson && weatherJson.precipitation && weatherJson.precipitation.probability && weatherJson.precipitation.probability.percent != null) {
        precip = weatherJson.precipitation.probability.percent;
      } else if (weatherJson && weatherJson.precipitation && weatherJson.precipitation.qpf && weatherJson.precipitation.qpf.quantity != null) {
        precip = weatherJson.precipitation.qpf.quantity;
      }
      console.log('Precipitation used for wildfire risk:', precip);
      temperature = temp;
      windSpeed = wind;
      humidity = humid;
      precipitation = precip;
    } catch (e) { }

    const newEnv = { temperature, windSpeed, humidity, precipitation, aqi, pm25, elevation, aqiCategory, aqiDisplay, aqiPollutant, aqiName };
    setEnvData(newEnv);
    return newEnv;
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setSharedLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (mapRef.current) {
        const { latitude, longitude } = currentLocation.coords;
        const radiusInMeters = 5000; // 5km

        // Rough calculation for deltas
        const latitudeDelta = radiusInMeters / 111320; // Meters in one degree of latitude
        const longitudeDelta = radiusInMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));

        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        });
        const env = await fetchEnvData(latitude, longitude);
        await updateWildfireRisk(latitude, longitude, env);
      }
    })();

    loadWildfireData();
  }, []);

  // Update map region when shared location changes
  useEffect(() => {
    if (sharedLocation?.latitude && sharedLocation?.longitude) {
      const { latitude, longitude } = sharedLocation;
      const radiusInMeters = 5000;
      const latitudeDelta = radiusInMeters / 111320;
      const longitudeDelta = radiusInMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));
      
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [sharedLocation]);

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

  // Custom autocomplete fetch
  const fetchSuggestions = async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}&language=en`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.predictions || []);
    } catch (e) {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const fetchPlaceDetails = async (placeId: string) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.result;
  };

  const [wildfireRiskFetched, setWildfireRiskFetched] = useState(false);

  // Animated value for button width
  const riskButtonAnim = useRef(new Animated.Value(44)).current;
  const riskButtonTargetWidth = wildfireRiskFetched && wildfireRisk ? 150 : 44;

  // Animate button width when risk is fetched
  useEffect(() => {
    Animated.timing(riskButtonAnim, {
      toValue: riskButtonTargetWidth,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [riskButtonTargetWidth]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HazMap</Text>
        <View
          style={styles.refreshButton}
        >
          <Flame size={20} color="#FF6B35" />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={search}
            onChangeText={fetchSuggestions}
            placeholder="Search for a place"
            placeholderTextColor="#888"
            style={{
              flex: 1,
              backgroundColor: '#222',
              color: '#fff',
              borderRadius: 8,
              paddingHorizontal: 10,
              height: 40,
              marginBottom: 2,
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setSuggestions([]);
              }}
              style={{ position: 'absolute', right: 10 }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {loadingSuggestions && <ActivityIndicator color="#fff" style={{ marginVertical: 4 }} />}
        {search.length >= 3 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={async () => {
                  const details = await fetchPlaceDetails(item.place_id);
                  setSearch(item.description);
                  setSuggestions([]);
                  if (
                    details &&
                    details.geometry &&
                    details.geometry.location &&
                    typeof details.geometry.location.lat === 'number' &&
                    typeof details.geometry.location.lng === 'number'
                  ) {
                    const { lat, lng } = details.geometry.location;
                    const radiusInMeters = 5000;
                    const latitudeDelta = radiusInMeters / 111320;
                    const longitudeDelta = radiusInMeters / (111320 * Math.cos(lat * (Math.PI / 180)));
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta,
                        longitudeDelta,
                      });
                      setSharedLocation({ latitude: lat, longitude: lng });
                      const env = await fetchEnvData(lat, lng);
                      await updateWildfireRisk(lat, lng, env);
                    }
                  } else {
                    alert('Could not get location details for this place.');
                  }
                }}
                style={{ padding: 10, backgroundColor: '#222', borderBottomWidth: 1, borderBottomColor: '#333' }}
              >
                <Text style={{ color: '#fff' }}>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={{ backgroundColor: '#222', zIndex: 10, maxHeight: 180, borderRadius: 8 }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* Environmental Data Bar */}
      <ScrollView style={styles.envBarScroll} horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.envBarCompact}>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Temp: {envData.temperature !== null ? `${envData.temperature}°C` : '--'}</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Wind: {envData.windSpeed !== null ? `${envData.windSpeed} m/s` : '--'}</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Humidity: {envData.humidity !== null ? `${envData.humidity}%` : '--'}</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Precip: {envData.precipitation !== null ? `${envData.precipitation} mm` : '--'}</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>AQI: {envData.aqiDisplay || '--'} ({envData.aqiCategory || '--'})</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Main: {envData.aqiPollutant || '--'}</Text></View>
          <View style={styles.envBox}><Text style={styles.envBoxText}>Elev: {envData.elevation !== null ? `${Math.round(envData.elevation)} m` : '--'}</Text></View>
        </View>
      </ScrollView>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={mapRegion}
          // customMapStyle={mapStyle} // Remove this line for hybrid
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="hybrid" // Set to hybrid for satellite + labels
        />
        {/* AQI-based graphical overlay */}
        {envData.aqi && envData.aqi > 50 ? (
          <LottieView
            source={require('../../assets/lottie/birds.json')}
            autoPlay
            loop
            style={{
              position: 'absolute',
              top: 20, // Position just below the environmental data bar
              left: 0,
              right: 0,
              height: '48%', // 20% larger than 40% (40% * 1.2 = 48%)
              zIndex: 10,
            }}
          />
        ) : envData.aqi && envData.aqi <= 50 ? (
          <LottieView
            source={require('../../assets/lottie/smoke.json')}
            autoPlay
            loop
            style={{
              position: 'absolute',
              top: 20, // Position just below the environmental data bar
              left: 0,
              right: 0,
              height: '40%', // Take up upper half of the map
              zIndex: 10,
            }}
          />
        ) : null}
        {/* Environmental Bar - top right overlay */}
        <ScrollView
          style={styles.envBarOverlay}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.envBarOverlayContent}
        >
          <View style={styles.envBarCompactOverlay}>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Temp: {envData.temperature !== null ? `${envData.temperature}°C` : '--'}</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Wind: {envData.windSpeed !== null ? `${envData.windSpeed} m/s` : '--'}</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Humidity: {envData.humidity !== null ? `${envData.humidity}%` : '--'}</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Precip: {envData.precipitation !== null ? `${envData.precipitation} mm` : '--'}</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>AQI: {envData.aqiDisplay || '--'} ({envData.aqiCategory || '--'})</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Main: {envData.aqiPollutant || '--'}</Text></View>
            <View style={styles.envBox}><Text style={styles.envBoxText}>Elev: {envData.elevation !== null ? `${Math.round(envData.elevation)} m` : '--'}</Text></View>
          </View>
        </ScrollView>
        {/* Custom recenter button */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={async () => {
            let currentLocation = await Location.getCurrentPositionAsync({});
            if (currentLocation && currentLocation.coords) {
              const { latitude, longitude } = currentLocation.coords;
              setSharedLocation({ latitude, longitude });
              const env = await fetchEnvData(latitude, longitude);
              await updateWildfireRisk(latitude, longitude, env);
              setSearch('');
              setSuggestions([]);
              if (mapRef.current) {
                const radiusInMeters = 5000;
                const latitudeDelta = radiusInMeters / 111320;
                const longitudeDelta = radiusInMeters / (111320 * Math.cos(latitude * (Math.PI / 180)));
                mapRef.current.animateToRegion({
                  latitude,
                  longitude,
                  latitudeDelta,
                  longitudeDelta,
                });
              }
            }
          }}
        >
          <Crosshair size={22} color="#FF6B35" />
        </TouchableOpacity>
        {/* Add wildfire risk button to the left of recenter button */}
        <Animated.View style={{ position: 'absolute', right: 78, bottom: 18, alignItems: 'center', zIndex: 21, width: riskButtonAnim }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#222',
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: wildfireRiskFetched && wildfireRisk ? 18 : 8,
              elevation: 4,
              borderWidth: 2,
              borderColor: '#FF6B35',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              width: '100%',
              minWidth: 44,
              height: 44,
              overflow: 'hidden',
            }}
            disabled={wildfireRiskLoading}
            onPress={async () => {
              if (wildfireRiskFetched && wildfireRiskFullResult) {
                setWildfireRiskModalVisible(true);
              } else if (!wildfireRiskLoading && sharedLocation?.latitude && sharedLocation?.longitude) {
                const env = await fetchEnvData(sharedLocation.latitude, sharedLocation.longitude);
                await updateWildfireRisk(sharedLocation.latitude, sharedLocation.longitude, env);
                // Modal will open on next tap after fetch completes
              }
            }}
          >
            {wildfireRiskLoading ? (
              <ActivityIndicator color="#FF6B35" />
            ) : (
              <>
                <Flame size={22} color="#FF6B35" style={{ marginRight: wildfireRiskFetched && wildfireRisk ? 10 : 0 }} />
                {wildfireRiskFetched && wildfireRisk && (
                  <Animated.Text
                    style={{
                      color: '#FF6B35',
                      fontWeight: 'bold',
                      fontSize: 15,
                      opacity: riskButtonAnim.interpolate({ inputRange: [44, 150], outputRange: [0, 1] }),
                      transform: [{ translateY: riskButtonAnim.interpolate({ inputRange: [44, 150], outputRange: [10, 0] }) }],
                      letterSpacing: 0.5,
                    }}
                    numberOfLines={1}
                  >
                    {wildfireRisk}
                  </Animated.Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        {selectedFire && (
          <View style={styles.fireDetails}>
            <View style={styles.fireDetailsHeader}>
              <View style={styles.fireDetailsInfo}>
                <Text style={styles.fireDetailsName}> {selectedFire.name}</Text>
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

      {/* Add Modal for wildfire risk result */}
      <Modal
        visible={wildfireRiskModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWildfireRiskModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#23272F', borderRadius: 20, padding: 36, maxWidth: 480, width: '92%', maxHeight: 520, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 }}>Wildfire Risk Prediction</Text>
            <Text style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 20, marginBottom: 12, textAlign: 'center', letterSpacing: 1 }}>{getParsedPrediction(wildfireRiskFullResult?.prediction)?.prediction || wildfireRisk || '--'}</Text>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={true}>
              {getParsedPrediction(wildfireRiskFullResult?.prediction)?.reasoning ? (
                <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22, textAlign: 'left' }}>{getParsedPrediction(wildfireRiskFullResult?.prediction).reasoning}</Text>
              ) : (
                !getParsedPrediction(wildfireRiskFullResult?.prediction) && wildfireRiskFullResult?.prediction && (
                  <Text style={{ color: '#E5E7EB', fontSize: 15, lineHeight: 22, textAlign: 'left' }}>{wildfireRiskFullResult.prediction.replace(/```json|```/g, '').trim()}</Text>
                )
              )}
            </ScrollView>
            <Pressable
              style={{ marginTop: 8, alignSelf: 'center', backgroundColor: '#FF6B35', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 36, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 4 }}
              onPress={() => setWildfireRiskModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  envBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    //backgroundColor: '#1A1A1A',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    minWidth: 600,
    paddingHorizontal: 12,
    gap: 18,
  },
  envBarScroll: {
    //backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    paddingTop: 10,
    paddingBottom:15,
  },
  envBarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  envBarCompact: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    //backgroundColor: '#1A1A1A',
    paddingVertical: 0,
    minWidth: 350,
    paddingHorizontal: 2,
    gap: 8,
    height: 28,
  },
  envBox: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 22,
    minWidth: 60,
    backgroundColor: 'rgba(26,26,26,0.95)',
  },
  envBoxText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  recenterButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  envBarOverlay: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 21,
    height: 36,
  },
  envBarOverlayContent: {
    alignItems: 'center',
  },
  envBarCompactOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0)',
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 8,
  },
});