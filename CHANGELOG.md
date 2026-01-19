# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.11] - 2026-01-18

### Added
- TransitCard tool card showing active buses, route badges, and real-time positions
- NewsCard tool card with headlines list, source badges, and timestamps
- OutagesCard tool card displaying power outage status by utility provider
- AviationWeatherCard tool card with METAR data, flight category badge, and NOTAM count
- Total of 12 generative UI tool cards now available in chat

## [0.1.10] - 2026-01-18

### Added
- Generative UI for chat widget with 8 rich tool cards:
  - WeatherCard, RiverLevelsCard, TrafficEventsCard, AirQualityCard (core)
  - WeatherAlertsCard, WeatherForecastCard, CitySummaryCard, GasPricesCard (new)
- Chat button in mobile navigation (center position, replacing Scanner)
- Mobile-native bottom sheet for chat that slides up from bottom
- ChatContext for shared state management between floating button and mobile nav
- Drag handle indicator on mobile chat sheet

### Changed
- Mobile navigation order: Map, Weather, Chat, Cameras, News
- Desktop chat uses side sheet, mobile uses bottom sheet

### Fixed
- Chat messages area now properly scrolls with fixed input at bottom
- react-markdown inline code detection for v9+ compatibility

## [0.1.9] - 2026-01-18

### Fixed
- Dashboard grid layout gaps when widgets have different heights or custom ordering
- Widgets now pack densely to fill available space

## [0.1.8] - 2026-01-18

### Added
- Live camera filter button in Traffic Cameras widget to show only cameras with live video feeds
- Filter displays count of available live cameras
- Empty state with quick link to show all cameras when filter yields no results

## [0.1.7] - 2026-01-18

### Added
- Gas Prices widget with daily Firecrawl scraping from GasBuddy
- Gas station markers on Interactive Map with price popups
- Vercel Cron job for daily 6 AM CST price updates
- Geocoding utility using Nominatim (OpenStreetMap)
- Fuel type tabs (Regular, Midgrade, Premium, Diesel) in widget

### Changed
- Status API now includes gas prices health check

## [0.1.6] - 2026-01-17

### Added
- OpenSky Network aircraft data source and /api/aircraft endpoint
- Aircraft tracking layer on the interactive map with SUX arrival/departure/nearby labels
- Aircraft service health indicator in the status bar

### Changed
- Animated radar uses RainViewer host + nowcast frames for smoother playback

### Fixed
- Animated radar overlay failing to render or animate in some cases

## [0.1.5] - 2025-01-17

### Added
- Google News RSS integration for fresher local news aggregation
- News deduplication to avoid duplicate stories across sources
- Smooth bus position interpolation (60fps animation between API updates)
- Transit widget expand/collapse with all buses and routes
- Click bus/route in Transit widget to highlight on map
- "Forecast" / "More" expand button labels on Weather and Transit cards
- 12 services tracked in status bar (added traffic events, snowplows, news, aviation)

### Changed
- Transit widget now uses expand pattern instead of modal dialogs
- Default widget order: Transit moved up, River Levels moved down
- Stale detection now uses API fetch timestamp instead of source observation time
- Increased stale threshold from 2x to 3x refresh interval

### Fixed
- "Stale" status showing incorrectly (was using NWS/USGS observation time)
- Google News descriptions showing raw HTML code
- Refresh button responsiveness

## [0.1.4] - 2025-01-17

### Added
- Expandable Weather widget with 7-day forecast
- Hourly forecast details in expanded view
- NOTAMs tab in Aviation Weather widget

### Fixed
- Wind speed/gust unit conversion respecting NWS API codes

## [0.1.3] - 2025-01-17

### Added
- Dynamic OpenGraph images for better link previews
- Vercel Web Analytics integration

### Changed
- Improved social share preview cards

## [0.1.2] - 2025-01-17

### Added
- NWS NEXRAD radar via Iowa Environmental Mesonet WMS
- Radar source toggle (NWS live vs RainViewer animated)
- Radar timeline indicator for animated mode

### Fixed
- Status API health checks using correct origin
- Radar layer visibility improvements

## [0.1.1] - 2025-01-16

### Added
- Real-time transit tracking with Passio GO integration
- METAR and TAF aviation weather for KSUX airport
- Refresh actions and freshness indicators on all widgets
- Widget freshness status (Live/Stale) based on data age

### Changed
- Rebranded to Siouxland.online

## [0.1.0] - 2025-01-15

### Added
- Initial release
- Interactive map with multiple data layers
- Traffic cameras (Iowa DOT + KTIV)
- Emergency scanner audio feeds
- Weather conditions and alerts from NWS
- River gauge monitoring (Missouri & Big Sioux)
- Air quality readings from AirNow
- Flight information for SUX airport
- Power outage tracking
- Earthquake monitoring
- Local news aggregation
- Drag-and-drop widget reordering
- Widget visibility settings
- Dark/Light theme support
- Responsive design with mobile navigation
