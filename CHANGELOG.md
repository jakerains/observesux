# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2026-01-19

### Added
- **Vercel Workflow** for gas price scraping with automatic retries and durability
  - Survives deployments and restarts mid-execution
  - Explicit error handling with FatalError vs RetryableError
  - Observable via workflow inspector
- **Manual gas scrape trigger** in admin Tools panel with status polling
- **Device info tracking** in chat analytics (mobile/tablet/desktop detection)
- **Aircraft tracking via Airplanes.live** - includes military aircraft, no auth required

### Changed
- Switched aircraft API from OpenSky Network to Airplanes.live (more reliable, unfiltered data)

### Fixed
- Chat logging now captures messages sent via suggested question pills
- Duplicate contact info no longer appears (was showing in text AND structured block)
- AI no longer introduces itself when answering direct questions
- Vercel cron authentication for gas prices (proper header detection)

## [0.2.3] - 2026-01-19

### Added
- **Rotating suggested questions** in chat onboarding
  - Bank of 18 questions across 5 categories (weather, traffic, services, food, general)
  - "What's happening in Sioux City?" always shown first
  - 3 random questions rotate on each visit
  - Questions stay stable during a session

### Fixed
- Mobile chat sheet no longer covers bottom navigation
- Added swipe-down-to-close gesture on mobile drag handle
- Production API connectivity with better URL detection and logging

## [0.2.2] - 2026-01-19

### Added
- **Structured content blocks** in chat responses for rich inline formatting
  - `contact` block: renders phone (tap-to-call), address (maps link), email, website, hours
  - `hours` block: displays day-by-day operating hours in a clean table
  - `links` block: action buttons with descriptions
- AI system prompt updated with block syntax examples
- Added @json-render/core and @json-render/react packages (for future use)

### Changed
- Knowledge base search no longer shows a tool card - results stay behind the scenes
- ChatMarkdown now parses special code blocks and renders structured components

## [0.2.1] - 2026-01-19

### Added
- **Chat Logging System** with session tracking and PostgreSQL storage
- **Admin Dashboard** at `/admin` with password-protected access
  - View all chat sessions with message counts and timestamps
  - Drill into individual sessions to see full conversation history
  - Tool usage tracking per message
  - RAG management moved to unified admin page
- **SUX mascot image** in chat widget and mobile navigation
- **Scraped city content** for RAG: Sioux City government staff directories and police department news

### Changed
- Mobile navigation chat button now shows SUX mascot image instead of icon
- Chat route includes session ID in response headers for client tracking
- RAG admin consolidated into `/admin` page (removed standalone `/rag` route)

## [0.2.0] - 2026-01-18

### Added
- **RAG Knowledge Base System** with pgvector on Neon PostgreSQL
  - Semantic search using OpenAI text-embedding-3-small embeddings
  - Admin page at `/rag` for managing knowledge base entries
  - File upload support (.md, .json, .txt) with progress indicator
  - Automatic text chunking for long content
  - Duplicate detection by title and content
  - Trash system with soft delete and permanent delete options
- **SUX Agent Persona** - Siouxland Assistant (named after airport code)
  - Rebranded chat from "Sioux City Observer" to "SUX"
  - Guardrails to keep bot focused on Siouxland-related topics only
  - Politely declines off-topic requests (coding help, other cities, etc.)
- **searchKnowledgeBase tool** for chat to query RAG entries
- **"I Want To" action links** - direct URLs for city services (pay tickets, report issues, etc.)
- **Local restaurant data** with cuisine, ratings, and price levels ($-$$$$)
- **TextShimmer component** for elegant loading states during tool calls
- framer-motion dependency for animations

### Changed
- Chat always enabled (removed NEXT_PUBLIC_CHAT_ENABLED feature flag)
- Tool call display shows "Searching local info..." with shimmer animation
- System prompt updated with RAG knowledge base guidance and examples
- Embeddings use OpenAI API directly (not AI Gateway) to avoid rate limits
- Chat model allows AI Gateway to choose providers (removed groq-only restriction)

### Fixed
- Markdown headings stuck to previous text now render correctly
- Streaming text flicker reduced with CSS containment and GPU hints
- Message bubbles have smooth transitions during streaming

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
