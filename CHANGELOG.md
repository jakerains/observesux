# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.11] - 2026-03-14

### Added
- Pollen & Allergy widget in the iOS app — pollen bars, level banner, UV index
- Aurora Watch widget in the iOS app — Kp gauge, visibility status, "Look North" tip
- Sun & Daylight widget in the iOS app — live countdown, phase badge, sunrise/sunset times
- Aurora Watch widget on the web now features an animated aurora sky with twinkling stars and treeline silhouette

## [0.13.10] - 2026-03-14

### Changed
- Sun & Daylight widget redesigned with a live sun arc, daylight countdown with seconds, and current phase badge
- Daylight remaining is now the hero display, counting down in real time

## [0.13.9] - 2026-03-14

### Added
- Daily briefing now includes pollen alerts when allergy levels are elevated
- Daily briefing now includes aurora/Northern Lights alerts when visibility is possible
- Pollen, Aurora, and Sun services now tracked in the status bar

### Fixed
- Status bar showed "18/15 online" instead of "18/18" — three services were missing from the display
- Pollen widget showed "Low Pollen" banner while all individual readings showed dashes
- Dashboard no longer flashes content before the loading screen on first visit

## [0.13.8] - 2026-03-13

### Added
- Pollen & Allergy Forecast widget — ragweed, grass, birch, and alder pollen levels with UV index
- Aurora Watch widget — see when the Northern Lights might be visible from Sioux City
- Sun & Daylight widget — sunrise, sunset, golden hour, and day length
- Sunrise and sunset times now show in the main weather hero section

## [0.13.7] - 2026-03-13

### Added
- Custom 404 page with helpful navigation links instead of the default blank error
- Error page so unexpected crashes show a friendly message with a retry button
- Search engine structured data (JSON-LD) on the Events and Daily Digest pages
- Breadcrumb data for Events and Digest so Google can show navigation trails in search results

### Fixed
- Resources page was missing a title and description for search engines
- Resources and Privacy pages were missing from the sitemap

## [0.13.6] - 2026-03-11

### Changed
- New SUX mascot icon across the entire app — favicon, PWA icons, app icon, and splash screen
- Loading screen now shows the colorful SUX mascot instead of the old black & white logo
- Loading screen image loads much faster thanks to optimized sizing

## [0.13.5] - 2026-03-11

### Changed
- Upgraded to Claude Sonnet 4.6 because WE SUPPORT FREEDOM... but also for improved quality across chat, digest, and council recaps

## [0.13.4] - 2026-03-11

### Changed
- (Admin) Removed Users tab from admin panel to clean up space

### Fixed
- Logging in from the admin page now returns you to admin instead of the home page

## [0.13.3] - 2026-03-11

### Added
- Share buttons on council meeting recaps and the daily digest page
- (Admin) Content Studio threads now save to the database — your threads persist across sessions, devices, and browsers

## [0.13.2] - 2026-03-10

### Added
- Chat now has a 5-message limit per conversation to prevent abuse (start a new chat to continue)
- Share link widgets in chat — when SUX gives you a link to share, you get Copy Link, Share, and Open buttons
- SUX can now show the latest council meeting recap with shareable links directly in chat
- New "council recaps" tool so SUX knows the latest meeting date when you ask about sharing

### Fixed
- Fixed incorrect site URLs in chat and digest (now correctly points to siouxland.online)

## [0.13.1] - 2026-03-10

### Fixed
- (Admin) Content Studio canvas now restores correctly when switching between threads
- (Admin) Content Studio auto-save and responsiveness improvements

### Changed
- (Admin) Updated suggested prompt chips to be evergreen

## [0.13.0] - 2026-03-10

### Added
- Branded social share cards for digest and events pages
- Refreshed council meeting share cards
- (Admin) Content Studio thread system — manage multiple conversations with separate chat and canvas for each
- (Admin) Thread sidebar to create, switch, and delete threads

## [0.12.8] - 2026-03-10

### Changed
- Council meeting recaps now show the summary first, with Key Decisions, Topics Discussed, and Public Comments in collapsible sections (collapsed by default), followed by the full recap
- Same collapsible layout applied to the Expo mobile app council recap screen

## [0.12.7] - 2026-03-10

### Added
- "Suggest Resource" category in the suggestion modal so users can submit local businesses, places, and organizations for the resources page

## [0.12.6] - 2026-03-10

### Added
- Sioux City Resources page — comprehensive local directory with 80+ resources across 12 categories (government, arts, parks, education, dining, things to do, sports, shopping, health, transportation, community orgs, news & media)
- Search and category filtering on the resources page
- Resources icon in the dashboard header for quick access
- Footer link to resources page from the main dashboard

## [0.12.5] - 2026-03-10

### Changed
- Council meeting recap prompts now include current council member names as a grounding reference so the AI corrects transcript misspellings

## [0.12.4] - 2026-03-10

### Fixed
- Push notifications for new council meeting recaps now fire from all ingestion paths — manual processing, transcript uploads, recap regeneration, and single-meeting retries (previously only the automatic cron bulk ingestion sent them)

## [0.12.3] - 2026-03-09

### Changed
- Dashboard status checks now load faster and use less bandwidth — results are cached for 15 seconds instead of re-checking every time
- The radar map no longer fetches RainViewer data in the background when you're using the default NWS radar view
- Cleaned up unused pieces throughout the app for a slightly smaller download

### Fixed
- Removed duplicate code across 15+ pages that was doing the same thing in slightly different ways — everything now shares one copy

## [0.12.2] - 2026-03-08

### Changed
- Expo app release version is now 1.0.4 to match the shipped mobile fixes and OTA/runtime metadata
- Synced the Expo app pnpm lockfile with `package.json`, so EAS production builds no longer fail during the install dependencies phase
- Cleaned Expo app lint/config noise and hook dependency warnings for a clean release check

### Fixed
- Digest and council detail modals in the Expo app now reliably render on first open and when reopened
- iOS production builds no longer fail on EAS because of the stale Expo app lockfile

## [0.12.1] - 2026-03-05

### Added
- Sioux City Journal sports and business RSS feeds as additional news sources
- SUX tab icon now has a distinct selected state in the Expo app

### Changed
- News fetcher now has 5 feeds (was 3): KCAU9, SCJ local/sports/business, Google News
- Fixed KCAU9 feed URL (siouxlandproud.com permanently redirected to kcau9.com)
- Google News moved last in feed order so direct local sources win deduplication
- News result cap increased from 20 to 30 items
- News API route refactored to import from shared fetcher (eliminated ~300 lines of duplicated code)
- Expo app bumped to 1.0.4

## [0.12.0] - 2026-03-04

### Added
- Dynamic sitemap with council meeting URLs for SEO
- OpenGraph image generation for council meeting pages (`opengraph-image.tsx`)
- Section metadata layouts for council, digest, and events pages
- iOS icon asset added to Expo app config

### Changed
- Council meeting recap generation now uses `generateObject` with a Zod schema — eliminates fragile regex JSON parsing that caused raw JSON to appear in the widget
- Security headers added to all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Council meeting detail page now includes structured data (NewsArticle + BreadcrumbList JSON-LD schemas)

### Fixed
- Council widget and recap pages showing raw JSON instead of rendered content when AI response had unescaped characters in the article field
- JSONB recap field now correctly parsed in all DB read paths (handles both string and object forms)

## [0.11.0] - 2026-03-01

### Added
- Automation Logs admin panel — new "Automation" tab in the admin UI showing a live table of all cron job runs
- `cron_runs` database table with per-job indexes for efficient history queries
- `logCronRun()` DB helper that records job name, status, duration, result JSON, and error message; auto-prunes rows older than 90 days
- Six cron routes instrumented: gas-prices, check-alerts, digest, events, ingest-meetings, check-expo-receipts
- `GET /api/admin/cron-logs` endpoint returning paginated run history and per-job summary (latest run per job)
- Summary cards in Automation panel — one per job with status dot, schedule, last-run time, and duration; clickable to filter the run table

### Fixed
- Admin tab URL param validation now includes `automation-logs` — previously the tab silently fell back to chat-logs, preventing the panel from ever mounting

## [0.10.1] - 2026-03-01

### Added
- Admin push test panel now has separate buttons for Browser, All Devices (anonymous mobile), and Both channels
- `getAllActiveDeviceTokens` — blasts test push to every active anonymous device subscription

### Changed
- Alerts page simplified to browser push only — account-based alert subscription cards removed (no sign-in on web)
- Admin "Digest" nav label restored in mobile bottom nav; Bell icon in header provides alerts access
- Camera grid now memoized and refreshes snapshots on each tab visit via `useFocusEffect`
- Council Meetings notification type added to mobile notifications settings screen

### Fixed
- VAPID keys stored with trailing `\n` via `echo` pipe — re-uploaded with `printf` to Vercel; fixes "Vapid public key must be URL safe Base64" error

## [0.10.0] - 2026-03-01

### Added
- Anonymous browser push notifications — no account required; enable from the Bell icon in the header or the Alerts page
- Per-type browser push preferences (weather, river, air quality, traffic, digest, council meetings) stored in localStorage and synced to server
- Admin Notifications panel — live subscription stats across all 4 push channels (web, Expo, device, browser) plus test-send and manual alert-check tools
- New DB tables: `browser_push_subscriptions` and `browser_triggered_alerts` for anonymous browser push dedup

### Changed
- Web app now runs in full anonymous mode — no sign-in prompt or button shown to guests (mirrors mobile app behavior)
- Removed "Free Accounts!" tooltip from the dashboard header
- "Digest" replaced by "Alerts" in mobile bottom nav — Bell icon in header provides quick access to notification settings
- Alert check cron now sends to anonymous browser subscribers in addition to authenticated and device subscribers

### Fixed
- `feelsLike` field missing from `WeatherObservation` type (was breaking build)
- `council_meeting` missing from `ALERT_INFO` and `DEFAULT_CONFIGS` in alert components (was breaking build)

## [0.9.26] - 2026-02-28

### Changed
- Removed stale development artifacts: legacy native Swift iOS project, old RAG data scrapes, Remotion experiment, and leftover root-level EAS config

## [0.9.25] - 2026-02-28

### Added
- Mobile app: Expo push notification support — Expo push tokens registered and stored server-side, receipt polling cron for delivery confirmation
- Mobile app: Alerts screen in the More tab — subscribe/unsubscribe to weather, traffic, and other alert types from the app
- Mobile app: Air quality widget improvements — freshness status and cleaner display
- Mobile app: Map centers on user location with permission request on first use
- Mobile app: Rich gas station callout on map with prices and brand details
- Mobile app: 7-day forecast hi/lo pairs, full-bleed weather hero with bridge photo
- Mobile app: City Council widget with recap detail modal
- Mobile app: Markdown rendering in council recap article body

### Fixed
- Mobile app: Gas station callout shows regular/diesel prices correctly
- Mobile app: Diesel-only stations hidden from map layer
- Mobile app: Transit widget normalizes occupancy and schedule adherence fields, hides bogus schedule badges
- Mobile app: Forecast icons now reflect actual conditions instead of always showing sun
- Mobile app: All widgets use `dataUpdatedAt` for accurate Live/Stale freshness status

## [0.9.24] - 2026-02-27

### Changed
- Current conditions widget now uses Open-Meteo exclusively instead of NWS KSUX station — the airport sensor repeatedly caused issues (stale observations, null wind speed, inflated temps from runway asphalt); Open-Meteo is a high-quality 1km² grid model that is more representative of city conditions

### Fixed
- Gas price scraper was silently failing — Firecrawl was scraping GasBuddy without a JS wait, getting an empty shell (station listings are client-rendered); fixed by adding a 3s `wait` action
- Removed 48-hour `maxAge` cache from Firecrawl gas scrape calls that was locking in stale empty results
- Rewrote GasBuddy markdown parser to use a block-aware state machine matching the actual `### [Name]` → street → city/state → `$price` structure instead of fragile inline regex
- Admin panel "Run Scrape Now" always showed "Unknown error" — the frontend expected a workflow `runId` for polling, but the API returns a direct result; removed dead polling code and handle `success` response correctly

## [0.9.23] - 2026-02-27

### Fixed
- Weather hero now shows current conditions — NWS stale observation detection prevents days-old station data from being cached and served as current
- Open-Meteo fallback automatically activates when NWS station is offline or reporting stale data
- Removed redundant Next.js fetch cache layer on NWS requests that was holding onto stale responses
- Reduced weather DB cache TTL from 15 minutes to 5 minutes for fresher data on page load

## [0.9.22] - 2026-02-24

### Fixed
- Automated cron now syncs YouTube title/date changes for completed meetings — prevents stale metadata when YouTube renames videos after live streams
- "Add" button on completed feed items preserves completed status instead of resetting to pending

## [0.9.21] - 2026-02-24

### Added
- Upload Transcript button on each YouTube feed item — upload a transcript for any video directly from the check feed, pre-filled with title, video ID, and parsed meeting date
- "Add" button on new feed items to create a meeting record in the system without processing

### Fixed
- Council meetings not appearing in list or widget after ingestion — all council-meetings API routes were missing `force-dynamic`, causing Vercel to serve stale cached responses
- Recent Meetings list now orders by `updated_at` instead of `created_at`, so recently processed meetings always appear at the top
- Reprocessing a video from the feed now updates the title and meeting date from YouTube (previously kept stale values from the original ingestion)
- Deduplicate YouTube feed entries by title — filters out dead live stream links that YouTube leaves alongside the actual recorded VOD

## [0.9.18] - 2026-02-18

### Fixed
- **Stale data on first page load**: Replaced ISR caching (`export const revalidate`) with `force-dynamic` + CDN-only `s-maxage` on all 18 data API routes — eliminates ISR's stale-first behavior that served hours-old data after quiet periods
- **Double-stale caching**: Removed `stale-while-revalidate` from all Cache-Control headers, which added an extra stale-serving window on top of ISR
- **Browser caching**: Added `max-age=0` to all API responses so browsers always fetch from CDN instead of using local cache

## [0.9.17] - 2026-02-12

### Fixed
- **Traffic events health check**: Switched from HEAD request (returns 404 on Socrata) to lightweight SODA `$limit=1` GET query, fixing false "Partial Outage" in status bar

## [0.9.16] - 2026-02-07

### Changed
- **ISR caching on 18 API routes**: Removed `force-dynamic` from all public data routes so `revalidate` actually works — edge-cached responses instead of per-request serverless execution
- **Cache-Control headers**: Added `s-maxage` + `stale-while-revalidate` headers to all public data API responses
- **Status API rewrite**: Replaced 15 self-referencing fetch calls with direct upstream health checks, eliminating serverless fan-out
- **Dynamic imports**: ChatWidget, CameraGrid, ScannerPlayer, VoiceAgentWidget, and ChangelogModal now lazy-load to reduce initial bundle size
- **Bundle optimization**: Added framer-motion and react-markdown to `optimizePackageImports` for better tree-shaking
- **Font loading**: Added `display: swap` to Geist Mono font to prevent invisible text during load

### Added
- **Bundle analyzer**: `@next/bundle-analyzer` available via `ANALYZE=true pnpm build`

## [0.9.15] - 2026-02-03

### Added
- **Restaurant cards in SUX chat**: Rich interactive cards with menu buttons, call/directions/website actions, price indicators, and expandable hours when asking about local restaurants
- **Reusable ActionButton component**: Consistent button styling across all structured chat blocks with primary/secondary/ghost variants
- **Analytics tracking for council meetings**: Track when users click to read recaps (from widget or list) and watch full YouTube meetings
- **Analytics tracking for restaurant actions**: Track menu views, calls, directions, and website clicks from chat

### Fixed
- **Structured block rendering**: Added markdown normalization to properly render code blocks that were output inline by the AI

### Changed
- **Improved AI restaurant data extraction**: Stronger prompt instructions to extract ALL available fields (phone, address, menu link, hours) from knowledge base results

## [0.9.14] - 2026-02-03

### Added
- **Manual transcript upload for council meetings**: Upload `.md` or `.txt` transcripts directly in the admin panel — useful when YouTube auto-captions are unavailable or low quality
- **Meeting selector in upload modal**: Select an existing meeting from a dropdown to auto-fill title, date, and video ID — prioritizes meetings with "no captions" or "failed" status

## [0.9.13] - 2026-02-03

### Added
- **OpenGraph metadata for council meeting pages**: Share links like `siouxland.online/council/2026-02-02` on Facebook/Twitter and see rich previews with meeting title and summary
- **YouTube RSS feed panel in admin**: View all videos from the council channel, see their ingest status, and process new videos directly from the feed

### Fixed
- **Parse meeting date from video title**: Previously used YouTube publish date which was wrong when videos are pre-scheduled — now extracts the actual meeting date from the title (e.g., "February 2 2026")

## [0.9.12] - 2026-02-01

### Changed
- **Comprehensive README overhaul**: Updated README to document all features added since v0.7 — daily digest, council recaps, push notifications, user accounts, watchlist, voice agent, expanded tech stack table, and updated project structure

## [0.9.11] - 2026-02-01

### Added
- **Tuesday morning digest includes council meeting recap**: The Tuesday morning edition now automatically pulls the most recent council meeting recap from the database and includes key decisions, topics, and public comments — giving residents a quick summary of Monday night's meeting

## [0.9.10] - 2026-02-01

### Fixed
- **No time-of-day greetings in council recaps**: Banned "Good morning, Siouxland" and similar — blog posts are read asynchronously, not broadcast live

## [0.9.9] - 2026-02-01

### Changed
- **Stronger editorial voice in council recap prompt**: Added explicit guidance for opinionated blog-style writing — be opinionated, vary openings and energy, add editorial commentary, use dry observations
- **Sign-off scoped to generated content only**: SUX sign-off ("— SUX") now applies only to recaps and digests, not live chat responses

## [0.9.8] - 2026-02-01

### Changed
- **YouTube transcript fetching via Firecrawl**: Uses Firecrawl (browser-rendered scraping) to extract transcript text from YouTube watch pages — bypasses datacenter IP blocking that broke all previous InnerTube-based approaches

## [0.9.7] - 2026-02-01

### Changed
- **YouTube transcript fetching (take 4)**: Replaced all third-party libraries with direct HTML scraping — fetches the YouTube watch page, extracts `ytInitialPlayerResponse` JSON, finds caption track URLs, and fetches timedtext XML directly. No InnerTube API calls, no npm dependencies for transcript fetching.

## [0.9.6] - 2026-02-01

### Changed
- **YouTube transcript library swap**: Replaced `youtube-transcript-plus` with `youtube-caption-extractor` — uses YouTube's engagement panel transcript (sidebar UI) instead of the Innertube player API, which is blocked from datacenter IPs

## [0.9.5] - 2026-02-01

### Fixed
- **YouTube transcript fetching on Vercel (take 3)**: Rewrite Innertube player request from ANDROID client to WEB client — YouTube blocks ANDROID client calls from datacenter IPs but allows WEB client with browser headers

## [0.9.4] - 2026-02-01

### Fixed
- **YouTube transcript fetching on Vercel (take 2)**: Apply consent cookie to all three fetch hooks (videoFetch, playerFetch, transcriptFetch) — not just the watch page — so the Innertube player API and transcript XML requests also bypass YouTube's datacenter blocking

## [0.9.3] - 2026-02-01

### Added
- **Unified SUX personality** (`src/lib/ai/sux-personality.ts`): Single source of truth for SUX's voice, tone, and regional flavor — imported by chat, digest, and council recap prompts
- **SUX voice guide in CLAUDE.md**: Claude Code can now embody SUX's personality for social media posts, marketing copy, and public-facing content

### Changed
- Chat, digest, and council recap system prompts now import shared personality instead of defining it independently

### Fixed
- **YouTube transcript fetching on Vercel**: Added consent cookie bypass (`SOCS`/`CONSENT`) so transcripts load from datacenter IPs instead of hitting YouTube's consent wall
- **Transcript error handling**: Now catches library-specific error classes (`YoutubeTranscriptDisabledError`, etc.) instead of fragile string matching
- Added diagnostic logging for transcript fetch failures

## [0.9.2] - 2026-02-01

### Added
- **Council meeting blog posts** (`/council/[slug]`): Individual meeting pages with proper typography, topic badges, "At a Glance" sidebar, and AI disclaimer
- **Tailwind Typography plugin**: Installed `@tailwindcss/typography` so `prose` classes render headings, lists, and paragraphs correctly
- **Single meeting API** (`/api/council-meetings/[id]`): Accepts date slugs, UUIDs, or video IDs

### Changed
- Council listing page (`/council`) converted from expandable cards to a linked list — each meeting now links to its own blog post
- Council dashboard widget now says "Read Latest Recap" and links directly to the latest meeting post
- City Council widget promoted to Live Updates section (alongside Weather and Local News)

### Fixed
- Stale `processing` meetings are now retried after 15 minutes instead of being skipped forever
- Embedding generation parallelized in batches of 5 for faster council meeting ingestion

## [0.9.1] - 2026-02-01

### Added
- **City Council dashboard widget**: Shows latest meeting date, summary, and top decisions with link to full recaps page
- **Council recaps page** (`/council`): Expandable meeting cards with decisions, topics, public comments, and YouTube links
- **Council recaps API** (`/api/council-meetings/recaps`): Serves latest or all completed recaps for widget and page

## [0.9.0] - 2026-02-01

### Added
- **City Council meeting transcript ingestion pipeline**: Automated YouTube caption fetching, AI-generated recaps (via Claude Sonnet 4.5), and vector-searchable transcript chunks with YouTube timestamp deep links
- **Council meeting search API** (`/api/council-meetings/search`): Semantic search across council meeting transcripts with date filtering
- **`searchCouncilMeetings` chat tool**: AI agent can now answer questions about council decisions, votes, ordinances, and public hearings with direct links to the relevant moment in the meeting video
- **Council admin panel tab**: Stats dashboard, manual ingestion trigger with progress indicator, and expandable meeting list with recaps
- **Vercel Workflow for council ingestion**: Durable multi-step pipeline (RSS → transcript → chunking → recap → embeddings → storage) with automatic retries
- **Scheduled ingestion**: Cron runs Monday 11PM and Tuesday 10AM Central to catch new meeting uploads

## [0.8.0] - 2026-01-29

### Added
- **Community Events page** (`/events`): Full-page events view with search, source and date filters, list/calendar view toggle
- **Event submissions**: Authenticated users can submit community events for admin review
- **Events admin panel**: New "Events" tab in admin with approval/rejection workflow, stats, and admin notes
- **Events dashboard widget**: Compact upcoming events list on the main dashboard with source-colored badges
- **Event descriptions**: Hard Rock Casino and Tyson Events Center scrapers now extract description text (image alt text and subtitles)

### Fixed
- Hydration mismatch on events page caused by Radix UI ID generation (deferred rendering until after mount)

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
