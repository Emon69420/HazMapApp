import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Wind, Thermometer, Eye, Droplets, CircleAlert as AlertCircle } from 'lucide-react-native';

interface AirQualityData {
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
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
  timestamp: string;
}

export default function AirQualityScreen() {
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | '24h' | '7d'>('current');

  useEffect(() => {
    loadAirQualityData();
  }, []);

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
      };
      setAirQuality(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#22C55E'; // Good
    if (aqi <= 100) return '#EAB308'; // Moderate
    if (aqi <= 150) return '#F97316'; // Unhealthy for Sensitive
    if (aqi <= 200) return '#EF4444'; // Unhealthy
    if (aqi <= 300) return '#A855F7'; // Very Unhealthy
    return '#DC2626'; // Hazardous
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

  const getPollutantLevel = (value: number, type: string) => {
    // Simplified pollutant level assessment
    if (value <= 12) return { level: 'Low', color: '#22C55E' };
    if (value <= 35) return { level: 'Moderate', color: '#EAB308' };
    if (value <= 55) return { level: 'High', color: '#F97316' };
    return { level: 'Very High', color: '#EF4444' };
  };

  if (!airQuality) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading air quality data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Air Quality Index</Text>
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
              {getHealthRecommendation(airQuality.category)}
            </Text>
          </View>
        </View>

        <View style={styles.timeframeSelector}>
          {(['current', '24h', '7d'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive,
                ]}
              >
                {timeframe === 'current' ? 'Now' : timeframe === '24h' ? '24 Hours' : '7 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pollutantsSection}>
          <Text style={styles.sectionTitle}>Pollutant Breakdown</Text>
          
          <View style={styles.pollutantGrid}>
            {Object.entries(airQuality.pollutants).map(([key, value]) => {
              const level = getPollutantLevel(value, key);
              return (
                <View key={key} style={styles.pollutantCard}>
                  <Text style={styles.pollutantName}>
                    {key.toUpperCase().replace('PM', 'PM')}
                  </Text>
                  <Text style={styles.pollutantValue}>
                    {value} {key.includes('pm') ? 'μg/m³' : 'ppb'}
                  </Text>
                  <Text style={[styles.pollutantLevel, { color: level.color }]}>
                    {level.level}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Health Recommendations</Text>
          
          <View style={styles.recommendationCard}>
            <Eye size={20} color="#3B82F6" />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Visibility</Text>
              <Text style={styles.recommendationText}>
                Reduced visibility due to smoke and particulates. Use caution when driving.
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Wind size={20} color="#10B981" />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Indoor Air</Text>
              <Text style={styles.recommendationText}>
                Keep windows closed and use air purifiers. Avoid outdoor exercise.
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Droplets size={20} color="#8B5CF6" />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Hydration</Text>
              <Text style={styles.recommendationText}>
                Stay hydrated and consider wearing N95 masks when outdoors.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date(airQuality.timestamp).toLocaleTimeString()}
          </Text>
          <TouchableOpacity onPress={loadAirQualityData} disabled={isLoading}>
            <Text style={styles.refreshText}>Refresh</Text>
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
    fontWeight: '600',
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
});