# Siouxland.online

### Real-Time Observability Dashboard for Sioux City, Iowa

A comprehensive, real-time monitoring dashboard that aggregates live data from traffic cameras, weather services, river gauges, air quality sensors, transit tracking, gas prices, aircraft, and more — all in one sleek, responsive interface. Includes an AI assistant, automated daily digests, city council meeting recaps, push notification alerts, and user accounts with personalized watchlists.

**Live Site:** [siouxland.online](https://siouxland.online)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)
![Neon](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat-square)

---

## Highlights

- **14+ live data widgets** with auto-refresh and freshness indicators
- **AI Assistant (SUX)** — conversational AI with live data tools and generative UI
- **Voice Agent** — talk to SUX via ElevenLabs real-time voice
- **Daily Digest** — three AI-generated editions per day (morning, midday, evening)
- **City Council Recaps** — automated AI summaries of Sioux City Council meetings
- **Push Notifications** — configurable alerts for weather, flooding, air quality, and traffic
- **User Accounts** — sign in to save alert preferences, watchlists, and settings
- **Interactive map** with radar, cameras, buses, aircraft, gas stations, and more
- **Drag-and-drop** customizable dashboard layout
- **Dark mode** with system preference detection
- **Fully responsive** — optimized for desktop, tablet, and mobile

---

## Features

### SUX AI Assistant

<img src="public/sux.png" alt="SUX Assistant" width="80" align="left" style="margin-right: 16px;" />

- **Conversational AI** powered by Claude via OpenRouter with Siouxland-specific knowledge
- **13+ live data tools** — queries weather, traffic, rivers, flights, gas prices, events, and more in real-time
- **Generative UI** — rich tool cards for weather, forecasts, alerts, river levels, gas prices, aviation, and more
- **RAG Knowledge Base** — semantic search over curated local information
- **Guardrails** — stays focused on Siouxland topics, politely declines off-topic requests
- Available via floating chat button (desktop) or bottom sheet (mobile)

<br clear="left"/>

### Voice Agent

- **Real-time voice conversation** powered by ElevenLabs Conversational AI
- Floating microphone widget — tap to start talking to SUX
- Microphone permission handling with connection status indicators
- Mute/unmute volume control during active sessions
- Feature-flagged via environment variable

### Daily Digest

- **Three automated editions** — Morning (6:15 AM), Midday (12 PM), Evening (6 PM)
- Aggregates 10+ data sources into AI-generated summaries
- Morning edition includes weather, commute info, school alerts, council recaps (Tuesdays), events
- Midday covers developing news, traffic, afternoon events
- Evening previews tomorrow's forecast, overnight alerts, weekend plans
- Built with Vercel Workflow DevKit for durable background execution
- Draft/approve workflow with version history
- Browsable archive at `/digest`

### City Council Meeting Recaps

- **Automated YouTube ingestion** from the Sioux City Council channel
- AI-generated recaps with key decisions, topics, and public comments
- Full transcripts split into searchable chunks with vector embeddings
- Semantic search across all meeting transcripts
- Blog-style pages at `/council` with individual meeting detail views
- Dashboard widget showing the latest meeting
- Integrated into Tuesday morning digest

### Push Notifications & Alerts

- **Configurable alert types** — weather, river flooding, air quality, traffic
- Per-type severity filters (e.g., only Severe/Extreme weather alerts)
- Customizable thresholds (e.g., AQI above 100)
- Web Push API integration with browser notifications
- Deduplication to prevent duplicate alerts within a time window
- Managed from account settings at `/account/alerts`

### User Accounts & Watchlist

- **Neon Auth** (Better Auth) for sign-in/sign-up
- **Watchlist** — save favorite cameras, bus routes, river gauges, and gas stations
- **Alert subscriptions** — personalized notification preferences
- **Synced preferences** — settings stored in the database, not just localStorage
- Account hub at `/account` with sub-pages for alerts, watchlist, and digest preferences

### Interactive Map

- **Leaflet-powered** with multiple toggleable layers
- NWS NEXRAD radar via Iowa Environmental Mesonet
- Traffic camera markers with click-to-view
- Real-time bus positions with smooth 60fps interpolation
- Aircraft tracking (arrivals, departures, nearby traffic)
- Gas station markers with price popups
- River gauge locations with flood indicators
- Snowplow tracking during winter operations

### Weather & Alerts

- Real-time conditions from NWS (KSUX station)
- **Weather alert modal** — click any alert for full details, instructions, and timing
- **Expandable 7-day forecast** with hourly details
- 24-hour temperature trend charts
- Heat index / wind chill calculations

### Live Traffic Cameras

- **Iowa DOT camera network** with HLS video streaming
- KTIV community webcams (Signal Hill, Singing Hills, Riverfront)
- **Live filter** to show only cameras with active feeds
- Click-to-expand full-screen modal viewer

### Gas Prices

- Daily prices scraped from GasBuddy via Firecrawl
- **Fuel type tabs** — Regular, Midgrade, Premium, Diesel
- Cheapest station highlighted
- Station locations on map with price popups

### Aircraft Tracking

- **Airplanes.live** data (includes military aircraft)
- SUX arrival/departure association labels
- Live positions on map with altitude and speed
- Callsign and aircraft type display

### Community Events

- **Explore Siouxland** and **Tyson Events Center** calendar integration
- Dedicated events page with user-submitted events and admin review
- AI assistant can answer "What events are happening?"

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
- Health category indicators with colors

### Transit Tracking

- **Sioux City Transit** real-time bus positions
- Passio GO GTFS integration
- **Expandable view** showing all routes and buses
- Click bus/route to highlight on map

### Emergency Scanner

- **Custom audio player** for Broadcastify feeds
- Le Mars Fire and Rescue
- Sioux County Fire and EMS Dispatch
- Life Net Air Ambulance

### Additional Widgets

- **Flight Information** — SUX airport arrivals & departures
- **Power Outages** — MidAmerican Energy & Woodbury County REC
- **Local News** — Aggregated from Google News, KTIV, Siouxland Proud
- **Earthquakes** — USGS data within 500km radius

### Suggestion System

- **Lightbulb button** in header to submit feedback
- Categories: Feature Request, Bug Report, Improvement, Content, Other
- Optional email for follow-up
- Admin panel for managing suggestions

---

## Admin Panel

Password-protected admin area at `/admin` with:

- **Chat Logs** — View all AI chat sessions, messages, and tool usage
- **Knowledge Base** — Manage RAG entries (add, edit, delete documents)
- **Suggestions** — Review user feedback, update status (pending → reviewed → planned → implemented)
- **Council Ingestion** — Trigger meeting ingestion with live SSE progress log
- **Tools** — Manual triggers for gas price scraping and other maintenance tasks

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Database** | Neon Serverless PostgreSQL + pgvector |
| **Auth** | Neon Auth (Better Auth) |
| **AI (Chat)** | Claude via OpenRouter |
| **AI (Recaps/Digest)** | Claude Sonnet 4.5 via OpenRouter |
| **AI (Embeddings)** | OpenAI text-embedding-3-small |
| **AI (Voice)** | ElevenLabs Conversational AI |
| **Workflows** | Vercel Workflow DevKit |
| **Data Fetching** | SWR (stale-while-revalidate) |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **Video** | HLS.js for camera streams |
| **Scraping** | Firecrawl (gas prices, YouTube transcripts) |
| **Push** | Web Push API |
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
| [Airplanes.live](https://airplanes.live) | Aircraft positions (ADS-B) |
| [USGS Water Services](https://waterservices.usgs.gov) | River gauge readings |
| [NOAA Water Prediction](https://water.noaa.gov) | Flood forecasts |
| [AirNow](https://airnow.gov) | Air quality index |
| [Broadcastify](https://broadcastify.com) | Emergency scanner audio |
| [USGS Earthquakes](https://earthquake.usgs.gov) | Seismic activity |
| [Passio GO](https://passiogo.com) | Transit tracking (GTFS) |
| [Google News](https://news.google.com) | Aggregated local news |
| [GasBuddy](https://gasbuddy.com) | Gas prices (via Firecrawl) |
| [Explore Siouxland](https://exploresiouxland.com) | Community events |
| [YouTube](https://youtube.com) | Council meeting transcripts (via Firecrawl) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Neon database account (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/jakerains/siouxland-online.git
cd siouxland-online

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
# (Run the SQL in src/lib/db/schema.sql against your Neon database)

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEON_AUTH_BASE_URL=https://your-neon-auth-endpoint

# AI Services
OPENROUTER_API_KEY=your_openrouter_key

# Admin Panel
CHAT_LOGS_PASSWORD=your_admin_password

# Optional - Enhanced Data
AIRNOW_API_KEY=your_airnow_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Optional - Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Optional - Voice Agent (ElevenLabs)
ELEVENLABS_API_KEY=your_key
ELEVENLABS_AGENT_ID=your_agent_id
NEXT_PUBLIC_VOICE_AGENT_ENABLED=true

# Optional - Cron Jobs
CRON_SECRET=your_cron_secret
```

---

## Dashboard Features

### Drag-and-Drop Widget Reordering
Customize your dashboard layout by dragging widgets to your preferred positions. Layout persists in localStorage (or synced to your account if signed in).

### Widget Visibility Settings
Toggle individual widgets on/off via the settings panel. Perfect for focusing on the data that matters most.

### Expandable Widgets
Weather and Transit widgets can expand to show additional details (forecast, all routes/buses).

### Dark Mode
Full dark theme with system preference detection and manual toggle.

### Real-Time Updates
All widgets auto-refresh at appropriate intervals:
- Transit: 30 seconds (with position interpolation)
- Weather: 60 seconds
- Cameras: 2 minutes
- Aviation: 2 minutes
- Aircraft: 30 seconds
- River gauges: 5 minutes
- Gas prices: Daily

### Freshness Indicators
Each widget shows "Live" or "Stale" status based on data age.

---

## Project Structure

```
src/
├── app/
│   ├── api/                # Next.js API routes
│   │   ├── chat/           # AI assistant endpoint
│   │   ├── cron/           # Scheduled job triggers
│   │   ├── user/           # User-specific routes (alerts, watchlist, preferences)
│   │   ├── workflow/       # Digest & council ingestion endpoints
│   │   ├── council-meetings/
│   │   ├── suggestions/
│   │   ├── weather/
│   │   ├── rivers/
│   │   └── ...
│   ├── admin/              # Admin panel
│   ├── auth/               # Sign-in / sign-up pages
│   ├── account/            # User account settings
│   ├── council/            # Council meeting recaps
│   ├── digest/             # Daily digest viewer
│   └── page.tsx            # Main dashboard
├── components/
│   ├── dashboard/          # Widget components
│   ├── chat/               # AI chat components
│   │   └── tool-cards/     # Generative UI cards
│   ├── alerts/             # Push notification management
│   ├── watchlist/          # Favorites components
│   ├── digest/             # Digest viewer components
│   ├── admin/              # Admin panel components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── ai/                 # AI utilities (SUX personality, embeddings)
│   ├── auth/               # Neon Auth client & server
│   ├── db/                 # Database queries
│   ├── fetchers/           # External API fetchers
│   ├── hooks/              # Custom React hooks
│   └── contexts/           # React contexts
├── types/                  # TypeScript definitions
└── workflows/              # Vercel Workflow DevKit files
```

---

## Responsive Design

Siouxland.online is fully responsive:

- **Desktop**: Full dashboard grid with status bar showing all service indicators
- **Tablet**: Adaptive 2-column layout
- **Mobile**: iOS-style bottom navigation with chat bottom sheet

---

## Contributing

Contributions are welcome! You can also submit suggestions directly through the dashboard using the lightbulb button.

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
- Weather radar from [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu)
- Scanner audio from [Broadcastify](https://broadcastify.com)
- Aircraft data from [Airplanes.live](https://airplanes.live)
- AI capabilities powered by [Anthropic Claude](https://anthropic.com), [OpenRouter](https://openrouter.ai), and [ElevenLabs](https://elevenlabs.io)
- Durable workflows powered by [Vercel Workflow DevKit](https://useworkflow.dev)
- Web scraping powered by [Firecrawl](https://firecrawl.dev)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

<p align="center">
  <strong>Made with love for Siouxland</strong>
</p>
