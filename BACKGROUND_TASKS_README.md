# Background Wildfire Prediction Tasks

This app includes a background task system that automatically monitors wildfire risk every 10 minutes and sends notifications when high risk is detected.

## Features

- **Automatic Monitoring**: Checks wildfire risk every 10 minutes in the background
- **Smart Notifications**: Only sends alerts when risk is "High" or "Extreme"
- **Location Awareness**: Uses your current location for accurate predictions
- **User Control**: Toggle background monitoring on/off from the Profile screen

## Setup Instructions

### 1. API Key Configuration

Replace the placeholder API key in `services/backgroundTasks.ts`:

```typescript
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
```

Replace `YOUR_GOOGLE_API_KEY_HERE` with your actual Google API key.

### 2. Permissions

The app requires the following permissions:
- **Location**: To get your current coordinates
- **Notifications**: To send wildfire alerts
- **Background App Refresh**: To run tasks when app is in background

### 3. Testing

Use the "Test Wildfire Prediction" button in the Profile screen to manually test the prediction system.

## How It Works

1. **Background Task Registration**: When the app starts, it registers a background task that runs every 10 minutes
2. **Data Collection**: The task fetches:
   - Current weather conditions (temperature, wind, humidity, precipitation)
   - Air quality data (AQI, PM2.5, PM10, O3, NO2, SO2, CO)
   - Elevation data
3. **Risk Prediction**: Sends all data to the wildfire prediction API
4. **Smart Alerts**: Only sends notifications if risk level is "High" or "Extreme"

## API Endpoints Used

- **Google Weather API**: Current weather conditions
- **Google Air Quality API**: Air quality and pollutant data
- **Google Elevation API**: Elevation data
- **Google Geocoding API**: Location name for notifications
- **Wildfire Prediction API**: `http://34.130.243.115:5000/gee-data`

## Notification Content

When high risk is detected, you'll receive a notification with:
- Title: "🔥 Wildfire Risk Alert"
- Body: Location name, risk level, and safety reminder
- Data: Prediction details and coordinates

## Troubleshooting

### Background Tasks Not Running
- Ensure "Background App Refresh" is enabled in device settings
- Check that location permissions are granted
- Verify notification permissions are enabled

### No Notifications
- Check device notification settings for the app
- Ensure "Background Monitoring" is enabled in Profile screen
- Verify API key is correctly set

### API Errors
- Check internet connectivity
- Verify Google API key is valid and has required permissions
- Check wildfire prediction API endpoint availability

## Technical Details

- **Task Interval**: 10 minutes (600 seconds)
- **Battery Optimization**: Uses efficient background fetch
- **Error Handling**: Graceful fallbacks for API failures
- **Data Validation**: Ensures all required data is available before prediction

## Files Modified

- `services/backgroundTasks.ts` - Main background task implementation
- `app/_layout.tsx` - Background task initialization
- `app/(tabs)/profile.tsx` - User controls and testing
- `app.json` - Permissions and configuration

## Dependencies Added

- `expo-background-fetch` - Background task management
- `expo-task-manager` - Task definition and execution
- `expo-notifications` - Push notifications (already installed) 