# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Expo/React Native** mobile app for Siouxland Online, part of a monorepo. The parent directory contains the Next.js web app that provides the backend API. This mobile app is a client-only frontend that consumes the web app's API endpoints.

## Commands

```bash
# Development
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS Simulator (requires Xcode)
pnpm android            # Run on Android Emulator

# Code Quality
pnpm lint               # ESLint
pnpm typecheck          # TypeScript type checking

# Native Builds
pnpm prebuild           # Generate native iOS/Android projects
eas build --platform ios --profile development   # Development build
eas build --platform ios --profile production    # Production build
eas submit --platform ios                        # Submit to App Store
```

## Architecture

### Data Flow

The app has no backend - it fetches all data from the production web API (`https://siouxland.online`):

```
Mobile App → lib/api.ts → Web App API Routes → External Data Sources
```

- **Data Fetching**: React Query (`@tanstack/react-query`) with automatic refetch intervals
- **Type Safety**: Types in `lib/types.ts` mirror the web app's API response shapes
- **API Configuration**: `lib/api.ts` defines endpoints, the base fetcher, and refresh intervals

### Navigation Structure (Expo Router)

```
app/
├── _layout.tsx              # Root: QueryClientProvider, GestureHandler
├── (tabs)/                  # Bottom tab navigator
│   ├── _layout.tsx          # Tab configuration with SF Symbols
│   ├── (0-home)/           # Home tab (prefix for sort order)
│   ├── (map)/              # Interactive map tab
│   ├── (weather)/          # Weather details tab
│   ├── (cameras)/          # Camera grid tab
│   └── (more)/             # Settings tab
├── camera/[id].tsx          # Camera detail modal (formSheet presentation)
└── alert/[id].tsx           # Weather alert modal (formSheet presentation)
```

Each tab uses a nested group `(tab-name)/` with its own `_layout.tsx` for stack navigation within that tab.

### Widget Pattern

All dashboard widgets follow this structure:

1. **Use data hook** from `lib/hooks/useDataFetching.ts` (e.g., `useWeather()`)
2. **Calculate status** using `getDataStatus()` for Live/Stale/Error/Loading
3. **Wrap in `DashboardCard`** with title, SF Symbol, status, and refresh handler
4. **Handle loading** with `CardSkeleton` component
5. **Handle errors** gracefully with user-friendly message

Example:
```typescript
const { data, isLoading, isError, refetch, isFetching } = useWeather();
const status = getDataStatus(data?.timestamp, refreshIntervals.weather, isLoading, isError);

return (
  <DashboardCard title="Weather" sfSymbol="cloud.sun.fill" status={status} onRefresh={() => refetch()}>
    {/* Widget content */}
  </DashboardCard>
);
```

### iOS-First Design

- Uses `PlatformColor()` for native system colors (e.g., `PlatformColor('label')`, `PlatformColor('systemBackground')`)
- SF Symbols via `expo-symbols` for icons
- Haptic feedback via `expo-haptics` (check `process.env.EXPO_OS === 'ios'` before calling)
- iOS sheet presentation for modals (`presentation: 'formSheet'`, `sheetGrabberVisible`)

## Key Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | API base URL, endpoints, refresh intervals, fetcher |
| `lib/hooks/useDataFetching.ts` | React Query hooks for each data type |
| `lib/types.ts` | TypeScript interfaces matching web API responses |
| `components/DashboardCard.tsx` | Wrapper component for all widgets |
| `constants/Colors.ts` | Color system (light/dark themes) |
| `app.json` | Expo configuration, bundle ID, plugins |
| `eas.json` | EAS Build profiles (development/preview/production) |

## Adding a New Widget

1. Add types to `lib/types.ts` if new data shape
2. Add endpoint to `lib/api.ts` (both `endpoints` and `refreshIntervals`)
3. Create hook in `lib/hooks/useDataFetching.ts` using `useQuery`
4. Create widget in `components/widgets/NewWidget.tsx` following the widget pattern
5. Export from `components/widgets/index.ts`
6. Add to appropriate screen (e.g., `app/(tabs)/(0-home)/index.tsx`)

## API Response Shape

All API responses follow this wrapper:
```typescript
interface ApiResponse<T> {
  data: T | null;
  timestamp: string;  // Used for freshness calculation
  source: string;
  error?: string;
}
```

The `timestamp` is the API fetch time (not the source observation time) and determines Live/Stale status.
