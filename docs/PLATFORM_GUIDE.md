# Siouxland.online Platform Guide

This comprehensive guide documents all features, widgets, and functionality of the Siouxland Online real-time observability dashboard. Use this reference to answer user questions about the platform.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Dashboard Widgets](#dashboard-widgets)
3. [Interactive Map - Complete Guide](#interactive-map---complete-guide)
4. [Platform Features](#platform-features)
5. [AI Assistants](#ai-assistants)
6. [Status Indicators](#status-indicators)
7. [Data Sources & Attribution](#data-sources--attribution)
8. [Quick Reference Tables](#quick-reference-tables)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Platform Overview

### What is Siouxland.online?

Siouxland Online is a real-time observability dashboard for Sioux City, Iowa and the surrounding Siouxland region. It aggregates data from multiple public APIs and displays live information about weather, traffic, transit, air quality, river levels, aviation, and more in a responsive, customizable dashboard.

### Key Features

- **14 Data Widgets**: Live information from weather, traffic, transit, aviation, and more
- **Interactive Map**: Multi-layer map with cameras, events, buses, aircraft, and more
- **AI Assistants**: Chat with SUX (text) or use voice commands
- **Customizable Layout**: Drag-and-drop widgets, enable/disable features
- **Dark/Light Theme**: Automatic system detection or manual toggle
- **Mobile Friendly**: iOS-style navigation on mobile devices
- **Real-time Updates**: Data refreshes automatically at widget-specific intervals

### Technology

- Built with Next.js 16, React 19, and Tailwind CSS v4
- Data fetching via SWR with polling
- Maps powered by Leaflet and React-Leaflet
- Database: Neon Serverless PostgreSQL

---

## Dashboard Widgets

The dashboard contains 14 widgets, each displaying different real-time data. All widgets show a "Live" or "Stale" status indicator based on data freshness.

### 1. Interactive Map

**Purpose**: Full-width map showing all data layers for Sioux City area

**Features**:
- 8 toggleable layers (Radar, Cameras, Rivers, Events, Snowplows, Transit, Aircraft, Gas Stations)
- Click markers to see popup details
- Two radar options (NWS NEXRAD or RainViewer animated)
- Solo layer mode (click legend item to isolate one layer)

**Size**: Full width (spans entire dashboard)

**See**: [Interactive Map - Complete Guide](#interactive-map---complete-guide) for detailed information

---

### 2. Weather Widget

**Purpose**: Current conditions, forecasts, and weather alerts for Sioux City

**Data Source**: National Weather Service (NWS) API
**Refresh Interval**: 60 seconds (current conditions), 300 seconds (forecast)

**Displays**:
- Current temperature with feels-like (wind chill/heat index)
- Wind speed, direction, and gust warnings
- Humidity and visibility
- Weather alerts with severity badges (Extreme, Severe, Moderate, Minor)
- 24-hour temperature trend chart

**Expanded View** (click expand button):
- 12-hour hourly forecast
- 7-day extended forecast with precipitation chances
- High/low temperatures per day

**Weather Icons**:
- Sun = Clear/Sunny
- Cloud = Cloudy/Overcast
- Rain cloud = Rain/Showers
- Snowflake = Snow
- Thunderstorm cloud = Thunderstorms
- Fog = Foggy conditions

---

### 3. Gas Prices Widget

**Purpose**: Current fuel prices at gas stations in Sioux City area

**Data Source**: GasBuddy (via scraper)
**Refresh Interval**: 1 hour (3600 seconds)

**Displays**:
- Cheapest station highlighted with green gradient
- Average, highest, and current prices
- Station count (24+ stations)
- Brand name, city, and price per gallon

**Features**:
- **Fuel Type Tabs**: Switch between Regular, Midgrade, Premium, Diesel
- **MapPin Button**: Click to view station location on interactive map
- **External Link**: Opens GasBuddy for more details

---

### 4. Sioux City Transit Widget

**Purpose**: Real-time bus locations and route information for Sioux City Transit

**Data Source**: Passio GO / Sioux City Transit API
**Refresh Interval**: 30 seconds (fastest updating widget)

**Displays**:
- Active buses count
- Number of routes running
- Bus speed, heading, and route color
- Vehicle ID for each bus

**Features**:
- **Click bus**: Highlights on map and tracks location
- **Click route**: Shows all buses on that route on map
- **Expand button**: Shows all routes and buses (collapsed shows 5)
- **Live/Stale per bus**: Each bus shows its own data freshness (120-second threshold)
- **Clear selection**: Button to deselect tracked bus/route

**Bus Status Indicators**:
- Green circle = Live data (updated within 2 minutes)
- Gray circle = Stale data (not updated recently)

---

### 5. Aviation Weather Widget (KSUX)

**Purpose**: Aviation weather data for Sioux Gateway Airport (KSUX)

**Data Source**: AviationWeather.gov API
**Refresh Interval**: 120 seconds (2 minutes)

**Three Tabs**:

#### METAR Tab (Current Conditions)
- Flight category badge with color:
  - **VFR** (Green) = Visual Flight Rules - Good conditions
  - **MVFR** (Blue) = Marginal VFR - Reduced visibility
  - **IFR** (Red) = Instrument Flight Rules - Low visibility
  - **LIFR** (Magenta/Fuchsia) = Low IFR - Very poor conditions
- Wind direction, speed, and gusts
- Visibility in miles
- Ceiling height and altimeter setting
- Cloud layers with base heights
- Temperature and dewpoint
- Weather phenomena (rain, snow, fog, etc.)
- Raw METAR string

#### TAF Tab (Forecast)
- Forecast periods: BASE, FM (From), TEMPO, BECMG (Becoming), PROB (Probability)
- Flight category for each period
- Valid time range
- Forecasted wind, visibility, and sky conditions
- Raw TAF string

#### NOTAMs Tab (Notices)
- NOTAM type badges:
  - **NOTAM D** = Distance NOTAMs
  - **FDC** = Flight Data Center
  - **TFR** = Temporary Flight Restriction
  - **GPS** = GPS outages
  - **General** = Other notices
- Effective dates
- Full NOTAM text

---

### 6. Air Quality Card

**Purpose**: Current air quality index (AQI) for Sioux City area

**Data Source**: AirNow API
**Refresh Interval**: 10 minutes (600 seconds)

**Displays**:
- AQI number (0-300+) with circular gauge
- AQI category with color-coded badge
- Emoji mood indicator
- Primary pollutant (PM2.5 or Ozone)
- PM2.5 and Ozone levels
- 24-hour AQI trend chart
- Health warning banner when unhealthy

**AQI Categories and Colors**:
| AQI Range | Category | Color | Emoji |
|-----------|----------|-------|-------|
| 0-50 | Good | Green | Happy face |
| 51-100 | Moderate | Yellow | Neutral face |
| 101-150 | Unhealthy for Sensitive Groups | Orange | Concerned face |
| 151-200 | Unhealthy | Red | Unhappy face |
| 201-300 | Very Unhealthy | Purple | Very unhappy face |
| 301+ | Hazardous | Dark Red/Maroon | Skull |

---

### 7. River Levels Widget

**Purpose**: Water levels and flood status for Missouri River and Big Sioux River

**Data Source**: USGS Water Data API
**Refresh Interval**: 5 minutes (300 seconds)

**Displays per River**:
- River name (Missouri River, Big Sioux River)
- Current gauge height in feet
- Flood stage status badge
- Progress bar showing level relative to flood stages
- Trend indicator (rising, falling, steady)
- Discharge in cubic feet per second (cfs)
- Water temperature
- 24-hour level trend chart

**Flood Stage Badges and Colors**:
| Stage | Color | Meaning |
|-------|-------|---------|
| Normal | Green | Below action stage |
| Action | Blue | Approaching minor flooding |
| Minor | Yellow | Minor flooding possible |
| Moderate | Orange | Moderate flooding |
| Major | Red | Major flooding |

**Progress Bar Markers**:
- Blue line = Action stage
- Yellow line = Minor flood stage
- Orange line = Moderate flood stage
- Red line = Major flood stage

---

### 8. Traffic Cameras Widget

**Purpose**: Live traffic camera feeds from Iowa DOT

**Data Source**: Iowa DOT Camera System
**Refresh Interval**: 2 minutes (120 seconds)

**Displays**:
- Grid of camera snapshots (2-3 columns)
- Camera name
- Roadway and direction
- "Live" badge for HLS-capable cameras

**Features**:
- **Hover**: Shows refresh and expand buttons
- **Click camera**: Opens modal with larger view
- **Modal tabs**: Snapshot (image) or Live (video stream)
- **Filter toggle**: "Show live cameras only" (HLS support)
- **View all/fewer**: Toggle between 6 preview and all cameras
- **Auto-refresh**: Snapshots refresh with cache-busting timestamps

---

### 9. Traffic Events Widget

**Purpose**: Active traffic incidents, construction, and road closures

**Data Source**: Iowa 511 System
**Refresh Interval**: 5 minutes (300 seconds)

**Displays**:
- Summary badge (incidents, construction, closures count)
- Event headline
- Roadway and direction
- Event type and severity
- Description (2-line preview)
- Start time (relative: "2 hours ago")
- Clear roads banner when no events (green)

**Event Types and Icons**:
- **Incident** = Crash, accident, or hazard
- **Construction** = Road work
- **Closure** = Road closed

**Severity Colors**:
| Severity | Color | Badge Style |
|----------|-------|-------------|
| Critical/Major | Red | Destructive |
| Major | Orange | Destructive |
| Moderate | Yellow | Default |
| Minor | Blue | Secondary |

---

### 10. Emergency Scanner Widget

**Purpose**: Live audio streams from local emergency services

**Data Source**: Broadcastify (via proxy)

**Three Scanner Feeds**:
1. **Le Mars Fire and Rescue** (Fire truck icon) - Broadcastify ID 15277
2. **Sioux County Fire and EMS** (Radio icon) - Broadcastify ID 46141
3. **Life Net-Air Methods West** (Helicopter icon) - Broadcastify ID 46227

**Features**:
- **Tab interface**: Switch between feeds
- **Play/Pause button**: Large animated button
- **Volume slider**: 0-100% with mute toggle
- **Equalizer animation**: Visual when audio is playing
- **Status badges**: Ready, Connecting, Live, Error

**Audio Controls**:
- Click center button to play/pause
- Drag slider or click track to adjust volume
- Click speaker icon to mute/unmute

---

### 11. Power Outages Widget

**Purpose**: Current power outages in the area

**Data Source**: MidAmerican Energy, Woodbury REC
**Refresh Interval**: 5 minutes (300 seconds)

**Displays**:
- Summary banner (green when no outages, yellow when active)
- Total active outages count
- Total customers affected
- Per-utility breakdown:
  - MidAmerican Energy (lightning icon)
  - Woodbury REC (house icon)

**Features**:
- **View Map buttons**: Opens utility's outage map in new tab
- **External link**: Statewide outage data

---

### 12. Airport Flights Widget (FlightBoard)

**Purpose**: Arrivals and departures at Sioux Gateway Airport (SUX)

**Data Source**: Sioux Gateway Airport
**Refresh Interval**: 5 minutes (300 seconds)

**Two Tabs**:
- **Arrivals**: Incoming flights with count
- **Departures**: Outgoing flights with count

**Displays per Flight**:
- Flight number with airline
- Origin/destination code and city name
- Scheduled time (12-hour format)
- Gate number
- Status badge

**Flight Status Colors**:
| Status | Color |
|--------|-------|
| Arrived/Departed | Green |
| Boarding/Landed | Blue |
| In Air | Sky Blue |
| Delayed | Yellow |
| Cancelled | Red |

---

### 13. Local News Widget

**Purpose**: Latest news headlines from local sources

**Data Sources**: KTIV, Siouxland Proud, Sioux City Journal (RSS feeds)
**Refresh Interval**: 5 minutes (300 seconds)

**Size**: Large (spans 2 columns on desktop)

**Displays**:
- News headline with external link icon
- Source badge with color
- Description (2-line preview)
- Published time (relative)
- Category tag (if available)

**Source Badge Colors**:
| Source | Color |
|--------|-------|
| KTIV | Blue |
| Siouxland Proud | Purple |
| Sioux City Journal | Green |

**Click headline** to open full article in new tab.

---

### 14. Seismic Activity Widget

**Purpose**: Recent earthquakes within 500km of Sioux City

**Data Source**: USGS Earthquake Hazards Program
**Refresh Interval**: 10 minutes (600 seconds)

**Displays**:
- Summary banner (green when calm, yellow when recent activity)
- Magnitude with circular display (M3.5, etc.)
- Location name
- Time relative (e.g., "2 days ago")
- Depth in kilometers
- Magnitude label (Micro, Minor, Light, Moderate, Strong)
- 7-day significant events (M3+) summary

**Magnitude Scale and Colors**:
| Magnitude | Label | Color |
|-----------|-------|-------|
| < 2.0 | Micro | Gray |
| 2.0-3.9 | Minor | Blue |
| 4.0-4.9 | Light | Yellow |
| 5.0-5.9 | Moderate | Orange |
| 6.0-6.9 | Strong | Red |
| 7.0+ | Major | Dark Red |

**Click earthquake** to open USGS detail page.

---

## Interactive Map - Complete Guide

The Interactive Map is the centerpiece of the dashboard, showing multiple data layers for the Sioux City area.

### Map Basics

- **Default Location**: Sioux City Center (42.4997, -96.4003)
- **Default Zoom**: Level 12
- **Base Map**: OpenStreetMap tiles
- **Controls**: Zoom buttons (top-left), pan by drag

### Map Layers

The map has 8 layers that can be toggled on/off using the "Layers" control in the top-right corner.

| Layer | Icon Color | What It Shows |
|-------|------------|---------------|
| Radar | Green | Weather radar overlay |
| Cameras | Blue | Traffic camera locations |
| Rivers | Cyan | River gauge stations |
| Events | Red | Traffic incidents/construction |
| Snowplows | Orange | Active snowplow locations |
| Transit | Emerald | Bus locations and routes |
| Aircraft | Sky Blue | Aircraft near/at SUX |
| Gas Stations | Green | Fuel prices at stations |

### Layer Controls

- **Toggle**: Click layer name to show/hide
- **Solo Mode**: Click a layer to hide all others and show only that layer
- **Show All**: Restore all enabled layers after solo mode
- **Count Badge**: Shows number of items in each layer

### Marker Types and What They Mean

#### Camera Markers (Blue)
- **Appearance**: Blue circle with camera crosshairs icon
- **Size**: 24x24 pixels
- **Click to see**: Camera name, live snapshot image, roadway/direction

#### River Gauge Markers (Cyan)
- **Appearance**: Cyan circle with wavy water lines
- **Size**: 28x28 pixels
- **Click to see**: Station name, gauge height, flood stage, discharge rate

#### Traffic Event Markers (Red)
- **Appearance**: Red warning triangle with exclamation mark
- **Size**: 28x28 pixels
- **Point faces down**
- **Click to see**: Event headline, type, severity, roadway, description

#### Snowplow Markers (Orange)
- **Appearance**: Orange circle with plow truck silhouette
- **Size**: 32x32 pixels
- **Click to see**: Vehicle name, activity status, speed, heading

**Snowplow Activity Status**:
- Plowing = Actively clearing snow
- Salting = Spreading salt/sand
- Both = Plowing and salting
- Deadheading = Traveling without plowing
- Parked = Stationary

#### Bus/Transit Markers (Emerald Green or Route Color)
- **Appearance**: Bus shape with wheels
- **Size**: 28x28 (normal), 36x36 (highlighted/selected)
- **Color**: Uses route-specific color, defaults to emerald green
- **Highlighted**: Dashed outline and larger when selected
- **Click to see**: Route name, vehicle ID, speed, heading, next stop

**Bus Selection**:
- Click a bus on map to track it
- Click a route in Transit Widget to highlight all buses on that route
- "Clear selection" button appears in popup when tracking

#### Aircraft Markers (Multi-color by Status)
- **Appearance**: Airplane icon rotated by heading
- **Size**: 32x32 pixels
- **Rotates**: Points in direction of travel

**Aircraft Colors by SUX Association**:
| Color | Meaning |
|-------|---------|
| Green | Arriving at SUX |
| Blue | Departing from SUX |
| Amber | Near SUX (within range) |
| Gray | Other aircraft |

**On Ground**: 50% opacity when not in flight

**Click to see**: Callsign, SUX association badge, altitude, speed, heading, vertical rate (climb/descend), squawk code

#### Gas Station Markers (Green)
- **Appearance**: Green fuel pump icon
- **Size**: 24x24 pixels
- **Click to see**: Brand name, address, all fuel prices (Regular, Midgrade, Premium, Diesel)

### Radar Options

Two radar overlays available:

#### NWS NEXRAD Radar (Default)
- Real-time precipitation from National Weather Service
- Updates every ~5 minutes
- Best for current conditions

#### RainViewer Animated Radar
- Animated loop showing past 2 hours
- Timeline slider from "-2h" to "Now"
- Auto-plays through frames
- Best for seeing storm movement

**Switch radars**: Click "NWS" or "Animated" button in radar legend section

### Legend and SUX Association

When Aircraft layer is active, a special legend appears:
- Green dot: "X arriving at SUX"
- Blue dot: "X departing from SUX"
- Amber dot: "X nearby SUX"

---

## Platform Features

### Header Controls

Located at the top of the dashboard:

- **Siouxland.online title**: Brand name with "Live" badge
- **Refresh Button** (circular arrows icon): Refreshes all widget data at once
- **Theme Toggle** (sun/moon icon): Switch between light and dark mode
- **Settings Button** (gear icon): Opens settings modal

### Settings Modal

Access by clicking the gear icon in the header.

**Features**:
- **Widget Toggles**: Enable/disable any of the 14 widgets
- **Quick Actions**:
  - "Show All" = Enable all widgets
  - "Hide All" = Disable all widgets
- **Widget Info**: Each widget shows icon, name, description, and size badge
- **Reset to Defaults**: Restore original widget configuration (requires confirmation)

**Size Badges**:
- Small = Single column widget
- Large = Two column span
- Full = Entire width

### Theme (Dark/Light Mode)

- **Automatic**: Follows system preference by default
- **Manual**: Click sun/moon icon in header to toggle
- **Persistent**: Choice is remembered

### Widget Layout Customization

**Drag and Drop**:
- Hover over widget to see drag handle (grip icon at top center)
- Click and drag to reorder widgets
- Widgets snap into grid positions
- Layout saves automatically to browser storage

**Grid Layout**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

### Mobile Navigation

On mobile devices, a bottom navigation bar appears with quick access to:
1. **Map** - Scrolls to Interactive Map
2. **Weather** - Scrolls to Weather Widget
3. **SUX Chat** - Opens chat assistant
4. **Cameras** - Scrolls to Traffic Cameras
5. **News** - Scrolls to Local News

Features iOS-style design with home indicator bar.

---

## AI Assistants

### SUX Chat Assistant

The SUX Chat Assistant helps answer questions about Sioux City, weather, traffic, local services, restaurants, and more.

**How to Access**:
- **Desktop**: Click white SUX mascot button (bottom-right corner)
- **Mobile**: Tap "SUX Chat" in bottom navigation bar

**Features**:
- Text-based chat interface
- Suggested questions to get started
- Rich responses with formatted data
- Tool cards showing live data (weather, traffic, gas prices, etc.)
- Markdown formatting support
- Clear chat button to start fresh

**Suggested Question Categories**:
1. Weather ("What's the weather like?")
2. Traffic ("Any traffic issues?")
3. Local Services ("Where's the nearest hospital?")
4. Food & Entertainment ("Best restaurants in Sioux City?")
5. General ("What's happening in Sioux City?")

**Tool Cards**: When you ask certain questions, SUX displays live data cards:
- Weather alerts and forecast
- Traffic events
- Gas prices
- Transit information
- Power outages
- Aviation weather
- News headlines
- And more

### Voice Agent (If Enabled)

Talk to the Sioux City Observer using voice commands.

**How to Access**: Click microphone button (bottom-right, below chat button)

**Connection States**:
- **Gray** (Disconnected): Click to connect
- **Spinning** (Connecting): Establishing connection
- **Green + Pulse** (Connected): Listening for voice
- **Red** (Error): Connection failed

**Controls When Connected**:
- **Mute/Unmute**: Toggle microphone
- **Disconnect**: Click button again

**Note**: Requires microphone permission from browser. The voice agent may not be available if the feature is disabled.

---

## Status Indicators

### Widget Data Freshness (Live/Stale Badges)

Each widget shows data freshness status:

- **Live** (Green badge): Data is current and recently updated
- **Stale** (Yellow/Gray badge): Data hasn't updated recently

**How freshness is determined**:
- Threshold = Refresh interval × 3
- Example: Weather (60s refresh) shows "Stale" after 180 seconds without update

### Status Bar (Desktop Only)

Located at the bottom of the dashboard:

**Displays**:
- Overall status badge ("All Systems Operational", "Partial Outage", "Service Disruption")
- Service count ("X/14 services online")
- Individual service icons with color status

**14 Services Monitored**:
Camera, Weather, Rivers, Air Quality, Transit, Traffic, Outages, Flights, Seismic, Snowplows, News, Aviation, Aircraft, Gas Prices

**Icon Colors**:
- Green = Online/Healthy
- Red = Offline/Error

**Hover over icon** to see service name and status.

---

## Data Sources & Attribution

Siouxland.online aggregates data from the following sources:

| Data Type | Source | Refresh Rate |
|-----------|--------|--------------|
| Weather | National Weather Service (NWS) | 60 seconds |
| Weather Forecast | NWS | 5 minutes |
| Weather Alerts | NWS | 60 seconds |
| Traffic Cameras | Iowa DOT | 2 minutes |
| Traffic Events | Iowa 511 | 5 minutes |
| Transit/Buses | Passio GO / Sioux City Transit | 30 seconds |
| Aviation Weather | AviationWeather.gov | 2 minutes |
| Air Quality | AirNow | 10 minutes |
| River Levels | USGS | 5 minutes |
| Gas Prices | GasBuddy | 1 hour |
| Power Outages | MidAmerican Energy, Woodbury REC | 5 minutes |
| Airport Flights | Sioux Gateway Airport | 5 minutes |
| Local News | KTIV, Siouxland Proud, SC Journal | 5 minutes |
| Earthquakes | USGS | 10 minutes |
| Aircraft | Airplanes.live | Real-time |
| Snowplows | Iowa DOT | Real-time |
| Radar | NWS NEXRAD, RainViewer | 5 minutes |
| Scanner Audio | Broadcastify | Live stream |

---

## Quick Reference Tables

### Widget Refresh Intervals

| Widget | Refresh Interval |
|--------|------------------|
| Transit | 30 seconds |
| Weather (current) | 60 seconds |
| Weather Alerts | 60 seconds |
| Traffic Cameras | 2 minutes |
| Aviation Weather | 2 minutes |
| Weather Forecast | 5 minutes |
| River Levels | 5 minutes |
| Traffic Events | 5 minutes |
| Power Outages | 5 minutes |
| Airport Flights | 5 minutes |
| Local News | 5 minutes |
| Air Quality | 10 minutes |
| Earthquakes | 10 minutes |
| Gas Prices | 1 hour |

### Map Icon Color Guide

| Icon Type | Color | Hex Code |
|-----------|-------|----------|
| Cameras | Blue | #3b82f6 |
| Rivers | Cyan | #06b6d4 |
| Traffic Events | Red | #ef4444 |
| Snowplows | Orange | #f97316 |
| Transit/Buses | Emerald Green | #10b981 |
| Aircraft (Arriving) | Green | #22c55e |
| Aircraft (Departing) | Blue | #3b82f6 |
| Aircraft (Nearby) | Amber | #f59e0b |
| Aircraft (Other) | Gray | #6b7280 |
| Gas Stations | Green | #22c55e |

### Flood Stage Definitions

| Stage | Description |
|-------|-------------|
| Normal | Water level is below the action stage |
| Action | Water level requires monitoring; minor flooding may develop |
| Minor | Minimal or no property damage, but some public inconvenience |
| Moderate | Some inundation of structures and roads near stream |
| Major | Extensive inundation, significant threat to life and property |

### AQI (Air Quality Index) Categories

| AQI | Category | Who Should Be Concerned |
|-----|----------|------------------------|
| 0-50 | Good | Air quality is satisfactory |
| 51-100 | Moderate | Unusually sensitive people may be affected |
| 101-150 | Unhealthy for Sensitive Groups | Children, elderly, those with respiratory issues |
| 151-200 | Unhealthy | Everyone may experience health effects |
| 201-300 | Very Unhealthy | Health alert: everyone may experience serious effects |
| 301+ | Hazardous | Health emergency: entire population likely affected |

### Aviation Flight Categories

| Category | Abbreviation | Ceiling | Visibility | Color |
|----------|--------------|---------|------------|-------|
| Visual Flight Rules | VFR | >3,000 ft | >5 miles | Green |
| Marginal VFR | MVFR | 1,000-3,000 ft | 3-5 miles | Blue |
| Instrument Flight Rules | IFR | 500-1,000 ft | 1-3 miles | Red |
| Low IFR | LIFR | <500 ft | <1 mile | Magenta |

---

## Frequently Asked Questions

### General

**Q: What is Siouxland.online?**
A: Siouxland.online is a real-time observability dashboard that displays live data about weather, traffic, transit, air quality, river levels, and more for Sioux City, Iowa and the surrounding Siouxland region.

**Q: Is Siouxland.online free to use?**
A: Yes, the dashboard is completely free to use.

**Q: How often does the data update?**
A: Each widget has its own refresh interval. Transit updates every 30 seconds (fastest), while gas prices update every hour. See the refresh intervals table above.

**Q: Can I use this on my phone?**
A: Yes! The dashboard is fully responsive with a mobile-friendly layout and iOS-style bottom navigation.

### Widgets

**Q: How do I enable/disable widgets?**
A: Click the gear icon in the header to open Settings. Toggle switches to enable or disable individual widgets.

**Q: How do I rearrange widgets?**
A: Hover over a widget to see the drag handle (grip icon), then click and drag to reorder.

**Q: What does "Live" vs "Stale" mean?**
A: "Live" means data was updated recently. "Stale" means data hasn't been refreshed within the expected timeframe (typically 3x the normal refresh interval).

**Q: Why is a widget showing an error?**
A: The data source may be temporarily unavailable. Try clicking the refresh button on the widget or the global refresh in the header.

### Map

**Q: How do I see only traffic cameras on the map?**
A: Click "Cameras" in the layer legend to enable solo mode, which hides all other layers.

**Q: What do the different colored aircraft mean?**
A: Green = arriving at SUX, Blue = departing from SUX, Amber = nearby SUX, Gray = other aircraft.

**Q: How do I view live video from a traffic camera?**
A: Click a camera marker on the map or in the camera widget, then select the "Live" tab in the popup (if HLS stream is available).

**Q: What are the wavy line markers on the map?**
A: Those are river gauge stations showing water levels for the Missouri River and Big Sioux River.

### Chat Assistant

**Q: What can I ask SUX?**
A: You can ask about weather, traffic conditions, local services, restaurants, city information, and more. Try the suggested questions to get started.

**Q: How do I clear the chat history?**
A: Click the "Clear Chat" button in the chat header (appears after you have messages).

**Q: Why doesn't the voice agent work?**
A: The voice agent may be disabled, or your browser may have denied microphone access. Check your browser permissions.

### Troubleshooting

**Q: The dashboard seems slow or frozen**
A: Try refreshing the page. If issues persist, clear your browser cache and reload.

**Q: A widget isn't showing any data**
A: Check if the widget shows "Stale" status. Try clicking the refresh button. The data source may be temporarily unavailable.

**Q: My widget layout keeps resetting**
A: Make sure your browser isn't blocking localStorage. The layout is saved in your browser's local storage.

**Q: Dark mode isn't working**
A: Try manually toggling the theme using the sun/moon icon in the header. If it still doesn't work, check if your browser supports CSS custom properties.

---

## About

**Siouxland.online** is an open-source project providing real-time observability for the Sioux City, Iowa community.

**Current Version**: Check the version number in the bottom-right corner of the dashboard (desktop) or footer (mobile).

**Feedback & Issues**: Report issues or suggestions on the project's GitHub repository.

---

*This guide is maintained as part of the Siouxland.online project for the SUX RAG knowledge base.*
