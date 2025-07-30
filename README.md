# 🌿 HazMap

> **Real-time environmental monitoring and hazard mapping for safer communities**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.20-lightgrey.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

HazMap is a comprehensive React Native application that provides real-time environmental monitoring, wildfire risk assessment, and emergency evacuation planning. Built with modern mobile technologies, it helps communities stay informed and prepared for environmental hazards.

## ✨ Features

### 🗺️ **Interactive Mapping**
- Real-time Google Maps integration
- Dynamic hazard overlay visualization
- Location-based services and geocoding
- Map styling for optimal user experience

### 🌬️ **Air Quality Monitoring**
- Real-time air quality data visualization
- Pollutant concentration breakdown
- Information regarding each pollutant to educate user
- Location-specific air quality 
- Animation based on air quality

### 🔥 **Wildfire Risk Assessment**
- Advanced wildfire prediction
- Real-time risk level monitoring
- Satellite data analysis
- Background task monitoring for continuous updates

### 🚨 **Emergency Evacuation**
- Dynamic evacuation route planning
- Real-time evacuation zone updates
- Emergency contact integration
- Route optimization for safety

### 📊 **Environmental Data**
- Comprehensive environmental monitoring
- Satellite data for vegetation cover

### 👤 **User Management**
- Secure authentication with Supabase
- User profile management
- Personalized settings and preferences
- Data synchronization across devices

## 🛠️ Tech Stack

- **Frontend**: React Native 0.79.5, Expo 53.0.20
- **Language**: TypeScript 5.8.3
- **Maps**: Google Maps API, React Native Maps
- **Database**: PostgreSQL
- **UI Components**: React Native Paper, Lucide Icons
- **Animations**: Lottie React Native
- **Background Tasks**: Expo Background Fetch
- **Location Services**: Expo Location
- **State Management**: React Context API
   - **APIs Used**: Google Maps Platform Weather API, Google Maps Platform Elevation API, Google Maps Platform AirQuality API, Google Earth Engine API



## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hazmap.git
   cd hazmap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
   ```

   **Required API Keys:**
   - **Google Maps API Key**: For mapping and location services
   - **Supabase URL & Key**: For database and authentication
   - **Custom API Endpoint**: For environmental data services

4. **Update Configuration Files**
   
   Replace the following placeholders in your codebase:
   - `API_KEY_HERE` → Your Google Maps API key
   - `SUPABASE_URL_HERE` → Your Supabase project URL
   - `SUPABASE_ANON_KEY_HERE` → Your Supabase anonymous key
   - `CUSTOM_API_ENDPOINT_HERE` → Your custom API endpoint

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on your device**
   - Scan the QR code with Expo Go app (Android)
   - Press `a` for Android emulator

## 🔧 Configuration

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
   - Elevation API
4. Create credentials (API Key)
5. Restrict the API key to your app's bundle identifier

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and anonymous key from Settings > API
3. Configure authentication providers as needed
4. Set up your database schema

### Environment Variables

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | ✅ |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase anonymous key | ✅ |

## 📁 Project Structure

```
hazmap/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/             # Reusable components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── services/              # API services
├── types/                 # TypeScript type definitions
└── assets/                # Static assets
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run start        # Start Expo development server
npm run android      # Run on Android
npm run build:web    # Build for web
npm run lint         # Run ESLint
```

### Code Style

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- React Native for cross platform development

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style


## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) for the mobile framework
- [Supabase](https://supabase.com/) for the backend services
- [Google Maps Platform](https://developers.google.com/maps) for mapping services


**Made with ❤️ for safer communities**
