# ObserveSUX

### Real-Time Observability Dashboard for Sioux City, Iowa

A comprehensive, real-time monitoring dashboard that aggregates live data from traffic cameras, emergency scanners, weather services, river gauges, air quality sensors, transit tracking, and more — all in one sleek, responsive interface.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)
![Neon](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat-square)

---

## Features

### Interactive Map
- **Leaflet-powered map** with multiple toggleable layers
- NWS NEXRAD radar via Iowa Environmental Mesonet (live precipitation)
- RainViewer animated radar option
- Traffic camera locations, river gauges, traffic events
- Real-time bus positions with smooth interpolation
- Snowplow tracking during winter operations

### Live Traffic Cameras
- **Iowa DOT camera network** with HLS video streaming
- KTIV community webcams (Signal Hill, Singing Hills, Riverfront)
- Click-to-expand full-screen modal viewer

### Emergency Scanner
- **Custom audio player** streaming Broadcastify feeds
- Le Mars Fire and Rescue
- Sioux County Fire and EMS Dispatch
- Life Net Air Ambulance (Sioux City)

### Weather & Alerts
- Real-time conditions from NWS (KSUX station)
- Active weather alerts and warnings
- **Expandable 7-day forecast** with hourly details
- 24-hour temperature trend charts

### Aviation Weather
- **METAR** (current conditions) for KSUX airport
- **TAF** (terminal forecast) with decoded conditions
- **NOTAMs** tab for pilot notices
- Flight category indicators (VFR/MVFR/IFR/LIFR)

### River Monitoring
- **Missouri River** gauge at Sioux City
- **Big Sioux River** levels
- Flood stage indicators with color-coded warnings
- Historical trend visualization

### Air Quality
- EPA AirNow AQI readings
- PM2.5, Ozone, and pollutant breakdowns
- Health category indicators

### Transit Tracking
- **Sioux City Transit** real-time bus positions
- Passio GO GTFS integration
- **Expandable view** showing all routes and buses
- Click bus/route to highlight on map
- Smooth position interpolation between updates

### Flight Information
- Sioux Gateway Airport (SUX/KSUX) arrivals & departures
- Live flight status updates

### Power Outages
- MidAmerican Energy outage tracking
- Woodbury County REC coverage

### Local News
- Aggregated from **Google News**, KTIV, Siouxland Proud, Sioux City Journal
- Filtered to show only recent stories (last 72 hours)
- Auto-deduplication across sources

### Seismic Activity
- USGS earthquake data within 500km radius
- Magnitude and location details

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Database** | Neon Serverless PostgreSQL |
| **Data Fetching** | SWR (stale-while-revalidate) |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **Video** | HLS.js for camera streams |
| **Icons** | Lucide React |
| **Drag & Drop** | dnd-kit |

---

## Data Sources

All data is sourced from **free, public APIs**:

| Source | Data Provided |
|--------|---------------|
| [Iowa DOT](https://iowadot.gov) | Traffic cameras, 511 events, snowplows |
| [National Weather Service](https://weather.gov) | Weather observations, alerts, forecasts |
| [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu) | NWS NEXRAD radar tiles |
| [AviationWeather.gov](https://aviationweather.gov) | METAR, TAF, NOTAMs |
| [USGS Water Services](https://waterservices.usgs.gov) | River gauge readings |
| [NOAA Water Prediction](https://water.noaa.gov) | Flood forecasts |
| [AirNow](https://airnow.gov) | Air quality index |
| [Broadcastify](https://broadcastify.com) | Emergency scanner audio |
| [USGS Earthquakes](https://earthquake.usgs.gov) | Seismic activity |
| [RainViewer](https://rainviewer.com) | Animated weather radar |
| [Passio GO](https://passiogo.com) | Transit tracking (GTFS) |
| [Google News](https://news.google.com) | Aggregated local news |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon database account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/jakerains/observesux.git
cd observesux

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

```env
# Required - Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Optional - API keys for enhanced data
AIRNOW_API_KEY=your_airnow_key

# Optional - Voice Agent (ElevenLabs)
ELEVENLABS_API_KEY=your_key
ELEVENLABS_AGENT_ID=your_agent_id
NEXT_PUBLIC_VOICE_AGENT_ENABLED=true
```

---

## Responsive Design

ObserveSUX is fully responsive with platform-specific optimizations:

- **Desktop**: Full dashboard grid with status bar showing all 12 service indicators
- **Tablet**: Adaptive 2-column layout
- **Mobile**: iOS-style bottom navigation with smooth scroll-to-section, optimized touch targets

---

## Dashboard Features

### Drag-and-Drop Widget Reordering
Customize your dashboard layout by dragging widgets to your preferred positions. Layout persists in localStorage.

### Widget Visibility Settings
Toggle individual widgets on/off via the settings panel. Perfect for focusing on the data that matters most to you.

### Expandable Widgets
Weather and Transit widgets can be expanded to show additional details (forecast, all routes/buses).

### Dark/Light Mode
Full theme support with system preference detection and manual toggle.

### Real-Time Updates
All widgets auto-refresh at appropriate intervals:
- Transit: 30 seconds (with position interpolation)
- Weather: 60 seconds
- Cameras: 2 minutes
- Aviation: 2 minutes
- River gauges: 5 minutes
- Traffic events: 5 minutes

### Historical Trends
Mini sparkline charts show 24-hour trends for weather, river levels, and air quality.

---

## Project Structure

```
src/
├── app/
│   ├── api/           # Next.js API routes
│   │   ├── cameras/
│   │   ├── weather/
│   │   ├── rivers/
│   │   ├── transit/
│   │   ├── aviation/
│   │   ├── news/
│   │   └── ...
│   ├── layout.tsx
│   └── page.tsx       # Main dashboard
├── components/
│   ├── dashboard/     # Widget components
│   │   ├── WeatherWidget.tsx
│   │   ├── RiverGauge.tsx
│   │   ├── CameraGrid.tsx
│   │   ├── TransitWidget.tsx
│   │   ├── InteractiveMap.tsx
│   │   └── ...
│   └── ui/            # shadcn/ui components
├── lib/
│   ├── db/            # Database queries
│   ├── fetchers/      # External API fetchers
│   ├── hooks/         # Custom React hooks
│   └── contexts/      # React contexts
└── types/             # TypeScript definitions
```

---

## Deploy on Vercel

The easiest way to deploy is with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jakerains/observesux)

---

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- Data provided by Iowa DOT, NWS, USGS, AirNow, and other public agencies
- Built with [shadcn/ui](https://ui.shadcn.com) components
- Weather radar from [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu) and [RainViewer](https://rainviewer.com)
- Scanner audio from [Broadcastify](https://broadcastify.com)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

<p align="center">
  <strong>Made with love for Siouxland</strong>
</p>
