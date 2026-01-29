# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.5] - 2026-01-29

### Fixed
- Digest AI no longer references stale school alerts — posts older than 24 hours are tagged with age metadata and the AI is instructed to ignore them
- School-related RSS news now includes publish dates so the AI can assess freshness

## [0.7.4] - 2026-01-27

### Fixed
- Pruned chat tool-call history before model requests to prevent follow-up message failures

## [0.7.3] - 2026-01-27

### Added
- **Tyson Events Center**: Added as new event source for community events widget
  - Scrapes concerts, Musketeers games, rodeos, and arena events
  - Handles date ranges and event subtitles
  - Deduplicates list/calendar view entries

## [0.7.2] - 2026-01-27

### Added
- **Digest draft/approve workflow**: Admin can preview generated digests before publishing
  - Digests are created as drafts (inactive) for review
  - Approve to publish or reject to discard
  - Prevents bad generations from going live automatically

### Changed
- **AI model pairing**: Digest uses Claude Opus 4.5 (higher quality), Chat uses Claude Sonnet 4.5 (faster)

### Fixed
- **School closing hallucinations**: AI no longer assumes schools are closed based on weather
  - Removed weather-triggered "school closings are common" prompts
  - System prompt now requires explicit confirmation before reporting closings
  - Added anti-hallucination instructions at multiple points
- **Switched to official school feed**: Now scrapes Sioux City Schools official weather alerts feed
  - Direct source instead of web search (no more stale/irrelevant results)
  - Only includes posts from the last 36 hours
  - Parses actual announcement content and dates

## [0.7.1] - 2026-01-26

### Added
- **Firecrawl web search**: Chat agent now uses Firecrawl for real-time web searches (replaced Perplexity gateway)
  - Searches include scraped page content for better answers
  - Location-aware results prioritizing Iowa/Siouxland
- **School updates in morning digest**: Firecrawl searches for school closings/delays
  - Dedicated search for "Sioux City school closing OR delay OR late start"
  - Results filtered to past 24 hours for relevance
  - Only runs for morning edition (when school info matters most)
- **Dark mode as default**: New users start with dark theme
- **Updated branding**: New favicon and icons featuring Siouxland bridge imagery
- **OpenGraph social sharing**: Uses screenshot image for link previews

### Changed
- **Switched to Anthropic models**: Chat and digest now use Claude instead of OpenAI
- Chat agent provides direct answers without unnecessary clarifying questions
- PWA install prompt is now less aggressive

### Fixed
- Mobile navigation behavior improvements
- AI tool descriptions updated to route sports queries correctly

## [0.7.0] - 2026-01-26

### Added
- **CurrentConditionsHero**: New Apple Weather-inspired hero section
  - Weather-aware gradient backgrounds (clear, cloudy, rainy, snowy, stormy, night)
  - Time-of-day bridge images (morning, noon, evening, night photos)
  - Expandable 7-day forecast with detailed weather info
  - AQI and river level badges with live status
  - Feels-like temperature and extended weather details
- **AlertBanner**: Unified alert system at top of dashboard
  - Combines weather alerts, flood warnings, and traffic incidents
  - Severity-based styling (critical/warning/info)
  - Dismissible alerts with expand for additional alerts
  - Animated pulse indicator for critical alerts
- **Time-of-day imagery**: Four new Sioux City bridge photos for hero backgrounds

### Changed
- **Complete UI redesign** with "Midwest Warm" theme
  - Warm amber, wheat, and cream tones replace cold grays
  - Deep brown/umber dark mode instead of slate
  - Rounded corners and modern card styling throughout
- Dashboard layout streamlined with hero section at top
- DashboardCard component redesigned with warm backgrounds
- DashboardHeader simplified with new theme integration
- MobileNavigation updated with warm accent colors
- StatusBar redesigned with amber indicators
- NewsWidget refreshed with new card styling
- DigestHistory updated with theme-consistent styling

### Removed
- Old Remotion promo video files (remotion/ directory)

## [0.6.6] - 2026-01-26

### Added
- **Digest version control**: Generate multiple versions per edition, select which is active
  - New `is_active` and `version` columns in digests table
  - Admin UI shows version badges and "Set Active" buttons
  - Only active versions display on homepage widget
- **Deep linking in digest**: News and events now include clickable URLs
  - AI embeds inline Markdown links for news stories and events
  - External link icon on rendered links in DigestViewer
- **School closings priority**: Morning edition now highlights school closings/delays
  - Keyword scanning in news for school-related terms
  - Weather-based detection (extreme cold, blizzards, ice storms)
  - Dedicated "School & Community Alerts" section for morning edition
- **Admin URL routing**: Tabs now persist in URL (`/admin?tab=digest`)
- **Cheapest gas station**: Digest now includes station name and address for lowest price

### Changed
- Digest route moved from `/account/digest` to `/digest`
- Increased news items from 5 to 8 for better school closing detection
- System prompt redesigned with edition-specific priorities and tone

### Fixed
- Summary markdown now renders properly in admin panel (bold, italic)
- Recent digests list renders markdown instead of raw `**` syntax
- Admin digest status pills now correctly check `isActive` flag
- Date comparison for "Generated today" badge handles Date objects
- Workflow error handling recovers from local dev state loss

## [0.6.5] - 2026-01-25

### Fixed
- Breaking news now respects article age (24-hour max)
  - Stories older than 24 hours no longer flagged as "breaking"
  - Prevents stale news from appearing in Digest as breaking

## [0.6.4] - 2026-01-25

### Added
- Weekly cron job for community events refresh (`/api/cron/events`)
  - Runs every Sunday at 6 AM UTC (midnight Central)
  - Firecrawl scraping now only happens via cron, not on-demand

### Changed
- Events fetcher simplified to cache-only architecture
  - Normal requests always serve from database cache (fast)
  - No external API calls during regular operation
- Events scraper admin tool now triggers force refresh

### Fixed
- Explore Siouxland events parser regex to match Firecrawl markdown format
- Hard Rock Casino events parser to handle bold links (`[**title**](url)`)
- Hard Rock date parsing for escaped pipe characters and optional times

## [0.6.3] - 2026-01-25

### Added
- Database caching layer for external API data
  - Weather observations cached for 15 minutes
  - Weather forecasts cached for 30 minutes
  - River gauge readings cached for 30 minutes
  - Air quality data cached for 60 minutes
  - Community events cached for 7 days
- New cache tables: `weather_cache`, `forecast_cache`, `river_cache`, `air_quality_cache`
- Cache-first fetching pattern reduces external API calls significantly

### Changed
- All fetchers now check database cache before making external API calls
- Chat agent benefits from caching via internal API routes

## [0.6.2] - 2026-01-25

### Added
- Force Regenerate toggle in admin digest panel to replace existing digests
- Digest generation preview with data source stats in admin UI
- Comprehensive debugging logs for workflow step execution

### Changed
- GPT-5.2 configuration updated for reasoning models
  - Removed unsupported `temperature` parameter
  - Added `reasoningEffort: 'low'` for faster content generation
  - Added `textVerbosity: 'medium'` for balanced output
- Events fetcher migrated from Jina Reader to Firecrawl v2 API
  - More reliable scraping with browser actions support
  - 30-second timeout for JavaScript-heavy pages

### Fixed
- `pruneOldDigests` now wrapped in workflow step (was failing due to fetch restriction)
- Middleware now excludes `.well-known/workflow` routes for proper orchestration
- Admin digest panel correctly reflects database state with force regenerate option

## [0.6.1] - 2026-01-25

### Added
- Vercel Workflow DevKit integration for durable digest generation
  - Each data fetch is now a retryable step with automatic retry on failure
  - Workflow UI provides full visibility into step-by-step execution
  - New `/api/workflow/digest` endpoint for manual workflow control
- Standalone news fetcher (`src/lib/fetchers/news.ts`) for direct RSS parsing
- Database migration for missing `summary` column in digests table

### Changed
- Digest cron handler now triggers durable workflow instead of inline execution
- Data fetchers called directly (no HTTP self-calls that caused timeouts)
- Middleware excludes workflow paths from authentication checks

### Fixed
- Digest generation "Data unavailable" bug caused by missing database column
- HTTP self-call timeouts during cron execution
- Silent failures in digest data aggregation now visible in workflow UI

## [0.6.0] - 2026-01-25

### Added
- Expo iOS app with native mobile experience
  - Bottom tab navigation (Home, Map, Weather, Cameras, More)
  - Native SF Symbols and iOS design patterns
  - React Query for data fetching with automatic refresh
  - Deep linking support (siouxland:// URL scheme)
- Mobile authentication with Bearer token support
  - New `/api/auth/mobile-token` endpoint for secure token exchange
  - Server-side token validation for mobile API calls
  - Dual auth strategy (cookies for web, Bearer tokens for mobile)
- App icons generated from Siouxland Online branding
- Digest promo video composition with Remotion (4 animated scenes)
- Standalone account pages for alerts (`/account/alerts`) and watchlist (`/account/watchlist`)
- Screenshot capture script for promotional assets

### Changed
- Chat API database operations are now non-fatal (chat works even if logging fails)
- Profile API now accepts both cookie and Bearer token authentication
- Map widget now locked at top of dashboard (not draggable)
- Default widget order: Digest and Weather appear first below map

### Fixed
- Mobile auth callback now properly retrieves session token from server
- User dropdown menu now appears above map (z-index stacking fix)
- JSX type import for React 19 compatibility in Remotion scenes

## [0.5.7] - 2026-01-24

### Added
- Enhanced transit data with occupancy status (Empty, Seats Available, Standing Only, Full)
- Real-time schedule adherence indicators (On Time, Early, Late with minutes)
- Trip progress tracking ("Stop 3 of 15") for each bus
- Stop name resolution from GTFS data (no more raw IDs)
- Route path polylines on map when route is selected
- Stop markers along selected routes
- New `/api/transit/gtfs` endpoint for static GTFS data
- Upcoming stops with scheduled times in bus popups

### Changed
- Dashboard settings moved to user dropdown menu for cleaner header
- Transit API now uses dynamic routes from GTFS instead of hardcoded data
- Bus popups show richer information (occupancy, schedule, next stops)

## [0.5.6] - 2026-01-24

### Added
- SEO: robots.ts for search engine crawl directives
- SEO: sitemap.ts for XML sitemap generation
- SEO: JSON-LD structured data (Organization, LocalBusiness, WebSite schemas)
- SEO: Page metadata layouts for auth, account, and admin routes

### Changed
- Rebranded from "ObserveSUX" to "Siouxland Online" throughout codebase
- Updated all User-Agent strings to "SiouxlandOnline/1.0"
- Package renamed from "observesux" to "siouxland-online"

## [0.5.5] - 2026-01-24

### Changed
- Morning digest now runs at 6:15 AM CST (after gas price scrape at 6:00 AM)
- Alert check cron reduced from every 5 minutes to hourly

## [0.5.4] - 2026-01-24

### Added
- Admin Digest panel for managing community newsletter generation
  - Manual generation controls for Morning, Midday, and Evening editions
  - Status badges showing which editions have been generated today
  - Recent digest history with timestamps
- Automated digest generation via Vercel Cron jobs
  - Morning edition at 6:00 AM CST
  - Midday edition at 12:00 PM CST
  - Evening edition at 6:00 PM CST
- Dashboard digest widget showing latest community digest summary

### Changed
- Digest page is now view-only (generation moved to admin panel)
- Digest generation uses edition-based system instead of per-user digests

## [0.5.3] - 2026-01-24

### Added
- News widget category filtering (All, Crime, Government, Business, Weather, Sports)
- Breaking news detection with highlighted styling and animated badge
- News category type definitions for keyword-based filtering

### Changed
- News refresh interval reduced from 5 minutes to 2 minutes
- Source badge colors now handle name variations from different feeds

### Fixed
- Sioux City Journal RSS feed now returns fresh content (fixed query parameter)
- Removed broken RSS feeds (KTIV, KMEG/KPTH, KWIT no longer provide RSS)
- Google News query reverted to simpler format for better results

## [0.5.2] - 2026-01-24

### Added
- Splash screen with progress bar on initial page load
- Tracks data source loading and shows visual feedback

## [0.5.1] - 2026-01-24

### Added
- Collapsible layers menu on map

### Fixed
- PWA name display
