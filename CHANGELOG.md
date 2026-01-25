# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
