import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

// Replace this with your actual Google API key
const GOOGLE_API_KEY = 'API_KEY_HERE';

const BACKGROUND_FETCH_TASK = 'background-wildfire-prediction';

interface EnvData {
  temperature: number | null;
  windSpeed: number | null;
  humidity: number | null;
  precipitation: number | null;
  aqi: number | null;
  pm25: number | null;
  elevation: number | null;
}

interface PollutantData {
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background task started');
    
    // Get current location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude: lat, longitude: lng } = location.coords;

    // Fetch environmental data
    const envData = await fetchEnvironmentalData(lat, lng);
    
    // Fetch pollutant data
    const pollutantData = await fetchPollutantData(lat, lng);
    
    // Call wildfire prediction API
    const prediction = await fetchWildfirePrediction(lat, lng, envData, pollutantData);
    
    // Send notification for any wildfire prediction
    if (prediction) {
      await sendWildfireAlert(prediction, lat, lng);
    }

    console.log('Background task completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Fetch environmental data (weather, elevation)
const fetchEnvironmentalData = async (lat: number, lng: number): Promise<EnvData> => {
  try {
    // Get elevation
    const elevRes = await fetch(`https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_API_KEY}`);
    const elevJson = await elevRes.json();
    const elevation = elevJson.results?.[0]?.elevation ?? null;

    // Get weather data
    const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherJson = await weatherRes.json();
    
    const temperature = weatherJson?.temperature?.degrees ?? null;
    const windSpeed = weatherJson?.wind?.speed?.value ?? null;
    const humidity = weatherJson?.relativeHumidity ?? null;
    const precipitation = weatherJson?.precipitation?.probability?.percent ?? 
                         weatherJson?.precipitation?.qpf?.quantity ?? null;

    return {
      temperature,
      windSpeed,
      humidity,
      precipitation,
      elevation,
      aqi: null, // Will be fetched separately
      pm25: null, // Will be fetched separately
    };
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    return {
      temperature: null,
      windSpeed: null,
      humidity: null,
      precipitation: null,
      elevation: null,
      aqi: null,
      pm25: null,
    };
  }
};

// Fetch pollutant data
const fetchPollutantData = async (lat: number, lng: number): Promise<PollutantData> => {
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
    
    return {
      aqi: aqiObj?.aqi ?? null,
      pm25: airJson?.pollutants?.find((p: any) => p.code === 'pm25')?.concentration?.value ?? null,
      pm10: airJson?.pollutants?.find((p: any) => p.code === 'pm10')?.concentration?.value ?? null,
      o3: airJson?.pollutants?.find((p: any) => p.code === 'o3')?.concentration?.value ?? null,
      no2: airJson?.pollutants?.find((p: any) => p.code === 'no2')?.concentration?.value ?? null,
      so2: airJson?.pollutants?.find((p: any) => p.code === 'so2')?.concentration?.value ?? null,
      co: airJson?.pollutants?.find((p: any) => p.code === 'co')?.concentration?.value ?? null,
    };
  } catch (error) {
    console.error('Error fetching pollutant data:', error);
    return {
      aqi: null,
      pm25: null,
      pm10: null,
      o3: null,
      no2: null,
      so2: null,
      co: null,
    };
  }
};

// Fetch wildfire prediction
const fetchWildfirePrediction = async (lat: number, lng: number, env: EnvData, pol: PollutantData): Promise<string | null> => {
  try {
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
    const res = await fetch(apiUrl);
    const json = await res.json();
    
    let risk = json?.prediction?.prediction || json?.prediction || json?.result?.risk || 'Unknown';
    
    // Clean up the risk string
    if (typeof risk === 'string') {
      const match = risk.match(/"prediction"\s*:\s*"(.*?)"/);
      if (match) risk = match[1];
      else if (risk.startsWith('"') && risk.endsWith('"')) risk = risk.slice(1, -1);
    }
    
    return risk;
  } catch (error) {
    console.error('Error fetching wildfire prediction:', error);
    return null;
  }
};

// Send wildfire alert notification
const sendWildfireAlert = async (prediction: string, lat: number, lng: number) => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get location name for better notification
    let locationName = 'your area';
    try {
      const geocodeRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const geocodeJson = await geocodeRes.json();
      const addressComponents = geocodeJson.results?.[0]?.address_components;
      if (addressComponents) {
        const city = addressComponents.find((comp: any) => 
          comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
        );
        if (city) {
          locationName = city.long_name;
        }
      }
    } catch (error) {
      console.log('Could not get location name:', error);
    }

    // Send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Wildfire Risk Alert',
        body: `wildfire risk in ${locationName}. Risk level: ${prediction}. Stay alert and follow local emergency guidelines.`,
        data: { prediction, latitude: lat, longitude: lng },
      },
      trigger: null, // Send immediately
    });

    console.log('Wildfire alert notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Export functions for testing
export { fetchEnvironmentalData, fetchPollutantData, fetchWildfirePrediction, sendWildfireAlert };

// Start background fetch
export const startBackgroundFetch = async () => {
  try {
    // Register background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 10 * 60, // 10 minutes in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('Background fetch task registered');
  } catch (error) {
    console.error('Error registering background fetch task:', error);
  }
};

// Stop background fetch
export const stopBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch task unregistered');
  } catch (error) {
    console.error('Error unregistering background fetch task:', error);
  }
};

// Check background fetch status
export const getBackgroundFetchStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    return status;
  } catch (error) {
    console.error('Error getting background fetch status:', error);
    return null;
  }
}; 