# Siouxland Online - iOS App

Native iOS app for Siouxland Online built with Expo and React Native.

## Features

- **Bottom Tab Navigation**: Home, Map, Weather, Cameras, More
- **Real-Time Data**: Weather, transit, traffic cameras, news
- **Interactive Map**: View cameras, buses, and traffic events
- **Dark Mode**: Automatic system theme support
- **Pull-to-Refresh**: Update data manually

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (via Xcode) or Expo Go app

### Installation

```bash
cd expo-app
pnpm install
```

### Development

```bash
# Start the development server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android
```

### API Configuration

The app connects to the Siouxland Online web app's API. Configure the base URL in `lib/api.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'  // Development
  : 'https://siouxland.online';  // Production
```

## Project Structure

```
expo-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab screens
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── map.tsx        # Interactive Map
│   │   ├── weather.tsx    # Full Weather
│   │   ├── cameras.tsx    # Camera Grid
│   │   └── more.tsx       # Settings
│   ├── camera/[id].tsx    # Camera detail modal
│   ├── alert/[id].tsx     # Alert detail modal
│   └── _layout.tsx        # Root layout
├── components/
│   ├── widgets/           # Dashboard widgets
│   ├── DashboardCard.tsx  # Widget wrapper
│   ├── ThemedText.tsx     # Themed text
│   └── ThemedView.tsx     # Themed container
├── lib/
│   ├── hooks/             # Data fetching hooks
│   ├── api.ts             # API configuration
│   └── types.ts           # TypeScript types
├── constants/
│   └── Colors.ts          # Theme colors
└── assets/                # Images and icons
```

## Building for Production

### iOS

```bash
# Create a production build
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Prerequisites for iOS builds

1. Apple Developer Account
2. App Store Connect access
3. Configure `eas.json` with your credentials

## Tech Stack

- **Expo SDK 52** - React Native framework
- **Expo Router 4** - File-based navigation
- **React Query** - Data fetching and caching
- **react-native-maps** - Map integration
- **expo-image** - Optimized images
- **date-fns** - Date formatting
