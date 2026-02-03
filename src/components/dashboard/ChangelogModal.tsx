'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Plus, RefreshCw, Bug, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Changelog data - update this when releasing new versions
const CHANGELOG = [
  {
    version: '0.9.14',
    date: '2026-02-03',
    added: [
      'Manual transcript upload for council meetings — upload .md or .txt files when YouTube captions are unavailable',
      'Meeting selector in upload modal — auto-fill details from existing meetings, prioritizes those needing transcripts',
    ],
  },
  {
    version: '0.9.13',
    date: '2026-02-03',
    added: [
      'OpenGraph metadata for council meeting pages — rich social previews when sharing links',
      'YouTube RSS feed panel in admin — view and process videos directly from the feed',
    ],
    fixed: [
      'Parse meeting date from video title instead of YouTube publish date',
    ],
  },
  {
    version: '0.9.12',
    date: '2026-02-01',
    changed: [
      'Comprehensive README overhaul — documents all features added since v0.7',
    ],
  },
  {
    version: '0.9.11',
    date: '2026-02-01',
    added: [
      'Tuesday morning digest includes Monday night council meeting recap — key decisions, topics, and public comments',
    ],
  },
  {
    version: '0.9.10',
    date: '2026-02-01',
    fixed: [
      'No time-of-day greetings in council recaps — blog posts are read asynchronously, not broadcast live',
    ],
  },
  {
    version: '0.9.9',
    date: '2026-02-01',
    changed: [
      'Stronger editorial voice in council recap prompt — opinionated takes, varied openings, editorial commentary',
      'SUX sign-off scoped to generated content (recaps, digests) only — no more sign-offs in live chat',
    ],
  },
  {
    version: '0.9.8',
    date: '2026-02-01',
    changed: [
      'YouTube transcript fetching now uses Firecrawl browser rendering — bypasses datacenter IP blocking',
    ],
  },
  {
    version: '0.9.7',
    date: '2026-02-01',
    changed: [
      'YouTube transcript fetching rewritten as zero-dependency HTML scraper — extracts captions directly from watch page',
    ],
  },
  {
    version: '0.9.6',
    date: '2026-02-01',
    changed: [
      'YouTube transcript library swapped from youtube-transcript-plus to youtube-caption-extractor for Vercel compatibility',
    ],
  },
  {
    version: '0.9.5',
    date: '2026-02-01',
    added: [
      'Unified SUX personality file — one voice across chat, digest, and council recaps',
      'SUX voice guide in CLAUDE.md for social media and marketing content',
    ],
    changed: [
      'All AI prompts now import shared personality definition',
    ],
    fixed: [
      'YouTube transcript fetching on Vercel (consent cookie on all fetch hooks)',
      'Transcript error handling with proper library error classes',
    ],
  },
  {
    version: '0.9.2',
    date: '2026-02-01',
    added: [
      'Council meeting blog posts (/council/2026-01-26) with full typography and AI disclaimer',
      'Single meeting API supporting date slugs, UUIDs, and video IDs',
      'Tailwind Typography plugin for proper prose rendering',
    ],
    changed: [
      'Council listing page now links to individual blog posts instead of expandable cards',
      'Council widget promoted to Live Updates section and links directly to latest post',
    ],
    fixed: [
      'Stale processing meetings now retried after 15 minutes instead of stuck forever',
      'Embedding generation parallelized (5x faster council ingestion)',
    ],
  },
  {
    version: '0.9.1',
    date: '2026-02-01',
    added: [
      'City Council dashboard widget with latest meeting recap',
      'Council recaps page (/council) with expandable meeting cards and YouTube links',
      'Council recaps API endpoint for widget and page data',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.9.0',
    date: '2026-02-01',
    added: [
      'City Council meeting transcript ingestion with AI recaps and vector search',
      'searchCouncilMeetings chat tool with YouTube timestamp deep links',
      'Council admin panel with stats, manual ingestion, and meeting recap viewer',
      'Scheduled ingestion via Vercel Cron (Mon night + Tue morning)',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.8.0',
    date: '2026-01-29',
    added: [
      'Community Events page (/events) with search, filters, and calendar view',
      'Event submissions with admin approval workflow',
      'Events admin panel tab with stats and review actions',
      'Events dashboard widget showing upcoming events',
      'Event descriptions from Hard Rock and Tyson Center scrapers',
    ],
    changed: [],
    fixed: [
      'Hydration mismatch on events page from Radix UI ID generation',
    ],
  },
  {
    version: '0.7.5',
    date: '2026-01-29',
    added: [],
    changed: [],
    fixed: [
      'Digest AI no longer references stale school alerts (older than 24h ignored)',
      'School-related RSS news now includes publish dates for freshness checks',
    ],
  },
  {
    version: '0.7.4',
    date: '2026-01-27',
    added: [],
    changed: [],
    fixed: [
      'Pruned chat tool-call history to prevent follow-up message failures',
    ],
  },
  {
    version: '0.7.3',
    date: '2026-01-27',
    added: [
      'Tyson Events Center as new event source (concerts, Musketeers, rodeos)',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.7.2',
    date: '2026-01-27',
    added: [
      'Digest draft/approve workflow in admin panel',
    ],
    changed: [
      'AI model pairing: Opus 4.5 for digest, Sonnet 4.5 for chat',
    ],
    fixed: [
      'School closing hallucinations - requires explicit confirmation now',
      'Switched to official Sioux City Schools feed (direct source, no more stale results)',
    ],
  },
  {
    version: '0.7.1',
    date: '2026-01-26',
    added: [
      'Firecrawl web search for real-time info in chat',
      'School closings/delays in morning digest via Firecrawl',
      'Dark mode as default theme',
      'New favicon and icons with Siouxland bridge',
    ],
    changed: [
      'Switched to Anthropic Claude models',
      'Chat agent answers directly without unnecessary questions',
      'PWA install prompt is less aggressive',
    ],
    fixed: [
      'Mobile navigation behavior',
      'Sports queries routed to web search correctly',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-01-26',
    added: [
      'CurrentConditionsHero: Apple Weather-inspired hero with weather gradients',
      'Time-of-day bridge images (morning, noon, evening, night)',
      'Expandable 7-day forecast in hero with detailed weather info',
      'AlertBanner: unified alerts for weather, floods, and traffic',
      'Severity-based alert styling with dismissible alerts',
    ],
    changed: [
      'Complete UI redesign with "Midwest Warm" theme',
      'Warm amber/wheat tones replace cold grays',
      'Dashboard layout with hero section at top',
      'All cards redesigned with modern styling',
      'Mobile navigation updated with warm accents',
    ],
    fixed: [],
  },
  {
    version: '0.6.6',
    date: '2026-01-26',
    added: [
      'Digest version control: generate multiple versions, select active one',
      'Deep linking in digest with clickable news/event URLs',
      'School closings priority for morning edition',
      'Admin URL routing (/admin?tab=digest)',
      'Cheapest gas station name and address in digest',
    ],
    changed: [
      'Digest route moved to /digest (was /account/digest)',
      'System prompt redesigned with edition-specific priorities',
    ],
    fixed: [
      'Summary markdown renders properly in admin panel',
      'Admin digest status pills check isActive flag correctly',
      'Workflow error handling for local dev state loss',
    ],
  },
  {
    version: '0.6.5',
    date: '2026-01-25',
    fixed: [
      'Breaking news now respects 24-hour age limit',
      'Stale stories no longer flagged as breaking in Digest',
    ],
  },
  {
    version: '0.6.4',
    date: '2026-01-25',
    added: [
      'Weekly cron job for community events refresh',
      'Events now refreshed automatically every Sunday',
    ],
    changed: [
      'Events fetcher simplified to cache-only architecture',
      'No external API calls during normal event requests',
    ],
    fixed: [
      'Events parser regex to match Firecrawl markdown format',
      'Hard Rock Casino parser for bold links and date formats',
    ],
  },
  {
    version: '0.6.3',
    date: '2026-01-25',
    added: [
      'Database caching for weather, rivers, air quality, and forecasts',
      'Cache-first fetching reduces external API calls',
      'Events cached for 7 days, weather for 15-30 min, rivers for 30 min',
    ],
    changed: [
      'All fetchers check database cache before external API calls',
      'Chat agent benefits from caching via internal API routes',
    ],
  },
  {
    version: '0.6.2',
    date: '2026-01-25',
    added: [
      'Force Regenerate toggle in admin digest panel',
      'Digest preview with data source stats in admin UI',
      'Comprehensive debugging logs for workflow steps',
    ],
    changed: [
      'GPT-5.2 config: reasoningEffort and textVerbosity settings',
      'Events fetcher migrated from Jina to Firecrawl v2 API',
    ],
    fixed: [
      'pruneOldDigests wrapped in workflow step for compatibility',
      'Middleware excludes .well-known/workflow routes',
      'Admin panel force regenerate option',
    ],
  },
  {
    version: '0.6.1',
    date: '2026-01-25',
    added: [
      'Vercel Workflow DevKit for durable digest generation',
      'Automatic retry on data fetch failures',
      'Workflow UI for step-by-step execution visibility',
      'Standalone news fetcher for direct RSS parsing',
    ],
    changed: [
      'Digest cron triggers durable workflow instead of inline execution',
      'Data fetchers called directly (no HTTP self-calls)',
    ],
    fixed: [
      'Digest "Data unavailable" bug from missing database column',
      'HTTP self-call timeouts during cron execution',
      'Silent failures now visible in workflow UI',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-01-25',
    added: [
      'Expo iOS app with native mobile experience',
      'Mobile authentication with Bearer token support',
      'App icons generated from Siouxland Online branding',
      'Digest promo video composition with Remotion',
      'Standalone account pages for alerts and watchlist',
    ],
    changed: [
      'Chat API database operations are now non-fatal',
      'Profile API accepts both cookie and Bearer token auth',
      'Map widget locked at top of dashboard (not draggable)',
    ],
    fixed: [
      'Mobile auth callback now retrieves session token correctly',
      'User dropdown menu now appears above map',
      'JSX type import for React 19 compatibility',
    ],
  },
  {
    version: '0.5.7',
    date: '2026-01-24',
    added: [
      'Transit occupancy status (Empty, Seats Available, Standing Only, Full)',
      'Real-time schedule adherence indicators (On Time, Early, Late)',
      'Trip progress tracking for each bus',
      'Stop name resolution from GTFS data',
      'Route path polylines on map when route selected',
      'Stop markers along selected routes',
    ],
    changed: [
      'Dashboard settings moved to user dropdown menu',
      'Bus popups show richer info (occupancy, schedule, next stops)',
    ],
    fixed: [],
  },
  {
    version: '0.5.6',
    date: '2026-01-24',
    added: [
      'SEO: robots.txt and sitemap.xml generation',
      'SEO: JSON-LD structured data for rich search results',
      'SEO: Page metadata for all routes',
    ],
    changed: [
      'Rebranded from "ObserveSUX" to "Siouxland Online"',
      'Updated User-Agent strings across all API fetchers',
    ],
    fixed: [],
  },
  {
    version: '0.5.5',
    date: '2026-01-24',
    added: [],
    changed: [
      'Morning digest runs at 6:15 AM (after gas price scrape)',
      'Alert check cron reduced from 5min to hourly',
    ],
    fixed: [],
  },
  {
    version: '0.5.4',
    date: '2026-01-24',
    added: [
      'Admin Digest panel for managing community newsletter',
      'Automated digest generation via cron (6am, 12pm, 6pm CST)',
      'Dashboard digest widget showing latest summary',
    ],
    changed: [
      'Digest page is now view-only (generation moved to admin)',
    ],
    fixed: [],
  },
  {
    version: '0.5.3',
    date: '2026-01-24',
    added: [
      'News category filtering (Crime, Government, Business, Weather, Sports)',
      'Breaking news detection with highlighted styling',
    ],
    changed: [
      'News refresh interval reduced to 2 minutes',
    ],
    fixed: [
      'Sioux City Journal RSS feed now returns fresh content',
      'Removed broken RSS feeds (KTIV, KMEG, KWIT)',
    ],
  },
  {
    version: '0.5.2',
    date: '2026-01-24',
    added: [
      'Splash screen with progress bar on initial load',
      'Tracks data sources and shows loading progress',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.5.1',
    date: '2026-01-24',
    added: [
      'Collapsible layers menu on interactive map',
    ],
    changed: [
      'PWA app name displays as "Siouxland Online" on home screens',
    ],
    fixed: [],
  },
  {
    version: '0.5.0',
    date: '2026-01-24',
    added: [
      'PWA Support - install as a native-like app with offline support',
      'Install prompt for Android/Chrome and iOS instructions',
      'Push notification infrastructure ready',
      'App shortcuts for Weather and Cameras',
      'New Siouxland Online branding with custom logo and icons',
    ],
    changed: [
      'Removed sign-in banner from bottom of page',
      'Enlarged header logo for better visibility',
    ],
    fixed: [],
  },
  {
    version: '0.4.5',
    date: '2026-01-24',
    added: [],
    changed: [],
    fixed: [
      'Chat agent no longer fabricates weather data',
      'Added "Never Fabricate Data" guardrail to system prompt',
    ],
  },
  {
    version: '0.4.4',
    date: '2026-01-21',
    added: [
      'User Profiles - collect first/last name for personalized chat',
      'Custom sign-up form with name fields',
      'SUX addresses users by name when logged in',
      'Redesigned Account Settings with tabbed interface',
    ],
    changed: [
      'Sign-up uses custom form instead of Neon Auth default',
      '/account redirects to /account/settings',
    ],
    fixed: [],
  },
  {
    version: '0.4.3',
    date: '2026-01-21',
    added: [],
    changed: [],
    fixed: [
      'Sign-in banner no longer appears on auth pages',
      'Sign-in banner sits above the status bar and mobile navigation',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-01-21',
    added: [
      'User Management - admins can now manage user accounts',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.4.1',
    date: '2026-01-21',
    added: [
      'User Accounts - optional sign-in with Neon Auth',
      'Save favorites, get alerts, sync across devices',
      'Admin role-based access for /admin panel',
      'Custom UserMenu component matching site theme',
      'Alert Subscriptions - push notifications for weather, river, AQI, traffic',
      'Watchlist - save favorite cameras, bus routes, river gauges, gas stations',
      'Chat Log User Tracking - admin can see which user sent each message',
    ],
    changed: [],
    fixed: [
      'Database connection uses correct Neon project (ep-calm-wave)',
      'Chat logs JOIN with neon_auth.user table (TEXT to UUID cast)',
      'SignInBanner hydration flash when logged in',
      'Geocoding rate limiting (1.1s delay) to avoid 503 errors',
      'Cron timeout increased to 300s for Pro plan',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-01-21',
    added: [
      'Suggestion/Feedback System - submit ideas via lightbulb button',
      'Category selection: Feature, Bug, Improvement, Content, Other',
      'Admin Suggestions tab with stats and status management',
      'Filter suggestions by status, expand for full details',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.3.0',
    date: '2026-01-21',
    added: [
      'Community Events tool for AI agent (Explore Siouxland)',
      'New /api/events endpoint with 30-minute cache',
      'Weather alert modal - click alerts to view full details',
    ],
    changed: [],
    fixed: [
      'Remotion build error (invalid premountFor prop)',
    ],
  },
  {
    version: '0.2.9',
    date: '2026-01-20',
    added: [
      'Gas stations now shown on map by default',
    ],
    changed: [
      'Gas Prices widget moved to top position',
      'Simplified radar to NWS only (removed animated option)',
    ],
    fixed: [
      'Gas prices scraper correctly parses Firecrawl response',
      'Handle string prices from GasBuddy',
    ],
  },
  {
    version: '0.2.8',
    date: '2026-01-20',
    added: [
      'Re-enabled Gas Prices widget with new Firecrawl agent',
      'Gas prices health check restored to status bar',
      'Gas stations map layer available (off by default)',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.2.7',
    date: '2026-01-20',
    added: [],
    changed: [
      'Simplified gas prices scraping (removed Workflow, direct cron)',
      'Cron runs daily at 8 AM CST (Hobby plan limit)',
      'New Firecrawl agent with Zod schema + targeted URLs',
    ],
    fixed: [
      'Gas prices cron now uses direct execution (more reliable)',
    ],
  },
  {
    version: '0.2.6',
    date: '2026-01-19',
    added: [],
    changed: [],
    fixed: [
      'Long URLs in chat now truncate to prevent overflow',
    ],
  },
  {
    version: '0.2.5',
    date: '2026-01-19',
    added: [
      'Comprehensive platform documentation for RAG KB',
    ],
    changed: [
      'Temporarily disabled Gas Prices (pending reliable data source)',
      'Gas stations map layer disabled by default',
    ],
    fixed: [],
  },
  {
    version: '0.2.4',
    date: '2026-01-19',
    added: [
      'Vercel Workflow for gas price scraping with auto-retries',
      'Manual gas scrape trigger in admin Tools panel',
      'Device info tracking in chat (mobile/tablet/desktop)',
      'Aircraft tracking via Airplanes.live (includes military)',
    ],
    changed: [
      'Switched aircraft API from OpenSky to Airplanes.live',
    ],
    fixed: [
      'Chat logging captures suggested question pill messages',
      'Duplicate contact info no longer shows twice',
      'AI no longer introduces itself on direct questions',
      'Vercel cron auth for gas prices',
    ],
  },
  {
    version: '0.2.3',
    date: '2026-01-19',
    added: [
      'Rotating suggested questions (18 questions, 5 categories)',
      '"What\'s happening?" always first, 3 random others rotate',
    ],
    changed: [],
    fixed: [
      'Mobile chat sheet no longer covers bottom nav',
      'Swipe-down-to-close on mobile drag handle',
      'Production API connectivity with better URL detection',
    ],
  },
  {
    version: '0.2.2',
    date: '2026-01-19',
    added: [
      'Structured content blocks in chat (contact, hours, links)',
      'Contact cards with tap-to-call phone and map links',
      'Hours blocks for operating schedules',
      'Action link blocks for quick actions',
    ],
    changed: [
      'Knowledge base search hidden from UI (works behind scenes)',
      'ChatMarkdown renders structured blocks inline',
    ],
    fixed: [],
  },
  {
    version: '0.2.1',
    date: '2026-01-19',
    added: [
      'Chat logging system with session tracking',
      'Admin dashboard at /admin with password auth',
      'View chat sessions and full conversation history',
      'Tool usage tracking per message',
      'SUX mascot image in chat and mobile nav',
      'Scraped Sioux City government and police content for RAG',
    ],
    changed: [
      'Mobile nav shows SUX mascot instead of chat icon',
      'RAG admin consolidated into /admin page',
    ],
    fixed: [],
  },
  {
    version: '0.2.0',
    date: '2026-01-18',
    added: [
      'RAG Knowledge Base with pgvector semantic search',
      'Admin page at /rag for managing knowledge entries',
      'File upload (.md, .json, .txt) with progress indicator',
      'SUX agent persona - Siouxland Assistant',
      'Guardrails to keep chat focused on Siouxland topics',
      '"I Want To" action links for city services',
      'Local restaurant data with price levels ($-$$$$)',
      'TextShimmer component for elegant loading states',
    ],
    changed: [
      'Chat always enabled (no feature flag)',
      'Tool calls show shimmer animation while searching',
      'Embeddings via OpenAI API directly (better rate limits)',
    ],
    fixed: [
      'Markdown headings render correctly during streaming',
      'Reduced text flicker with CSS optimizations',
      'Smooth message bubble transitions',
    ],
  },
  {
    version: '0.1.11',
    date: '2026-01-18',
    added: [
      'TransitCard for bus tracking with route badges',
      'NewsCard with headlines and source badges',
      'OutagesCard for power outage status',
      'AviationWeatherCard with METAR and flight category',
      '12 total generative UI tool cards in chat',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.1.10',
    date: '2026-01-18',
    added: [
      'Generative UI for chat with 8 rich tool cards',
      'Weather alerts, forecast, city summary, and gas prices cards',
      'Chat button in mobile navigation (center position)',
      'Mobile-native bottom sheet for chat',
    ],
    changed: [
      'Mobile nav order: Map, Weather, Chat, Cameras, News',
      'Desktop chat uses side sheet, mobile uses bottom sheet',
    ],
    fixed: [
      'Chat messages area now properly scrolls',
      'react-markdown inline code detection',
    ],
  },
  {
    version: '0.1.9',
    date: '2026-01-18',
    added: [],
    changed: [],
    fixed: [
      'Dashboard grid layout gaps when widgets have different heights',
      'Widgets now pack densely to fill available space',
    ],
  },
  {
    version: '0.1.8',
    date: '2026-01-18',
    added: [
      'Live camera filter button in Traffic Cameras widget',
      'Filter shows count of cameras with live video feeds',
      'Empty state with quick link to show all cameras',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '0.1.7',
    date: '2026-01-18',
    added: [
      'Gas Prices widget with daily Firecrawl scraping from GasBuddy',
      'Gas station markers on Interactive Map with price popups',
      'Vercel Cron job for daily 6 AM CST price updates',
      'Fuel type tabs (Regular, Midgrade, Premium, Diesel) in widget',
    ],
    changed: [
      'Status API now includes gas prices health check',
    ],
    fixed: [],
  },
  {
    version: '0.1.6',
    date: '2026-01-17',
    added: [
      'OpenSky Network aircraft data source and /api/aircraft endpoint',
      'Aircraft tracking layer on the interactive map with SUX arrival/departure/nearby labels',
      'Aircraft service health indicator in the status bar',
    ],
    changed: [
      'Animated radar uses RainViewer host + nowcast frames for smoother playback',
    ],
    fixed: [
      'Animated radar overlay failing to render or animate in some cases',
    ],
  },
  {
    version: '0.1.5',
    date: '2025-01-17',
    added: [
      'Google News RSS integration for fresher local news aggregation',
      'News deduplication to avoid duplicate stories across sources',
      'Smooth bus position interpolation (60fps animation between API updates)',
      'Transit widget expand/collapse with all buses and routes',
      'Click bus/route in Transit widget to highlight on map',
      '"Forecast" / "More" expand button labels on Weather and Transit cards',
      '12 services tracked in status bar',
    ],
    changed: [
      'Transit widget now uses expand pattern instead of modal dialogs',
      'Default widget order: Transit moved up, River Levels moved down',
      'Stale detection now uses API fetch timestamp instead of source observation time',
      'Increased stale threshold from 2x to 3x refresh interval',
    ],
    fixed: [
      '"Stale" status showing incorrectly',
      'Google News descriptions showing raw HTML code',
      'Refresh button responsiveness',
    ],
  },
  {
    version: '0.1.4',
    date: '2025-01-17',
    added: [
      'Expandable Weather widget with 7-day forecast',
      'Hourly forecast details in expanded view',
      'NOTAMs tab in Aviation Weather widget',
    ],
    fixed: [
      'Wind speed/gust unit conversion respecting NWS API codes',
    ],
  },
  {
    version: '0.1.3',
    date: '2025-01-17',
    added: [
      'Dynamic OpenGraph images for better link previews',
      'Vercel Web Analytics integration',
    ],
    changed: [
      'Improved social share preview cards',
    ],
  },
  {
    version: '0.1.2',
    date: '2025-01-17',
    added: [
      'NWS NEXRAD radar via Iowa Environmental Mesonet WMS',
      'Radar source toggle (NWS live vs RainViewer animated)',
      'Radar timeline indicator for animated mode',
    ],
    fixed: [
      'Status API health checks using correct origin',
      'Radar layer visibility improvements',
    ],
  },
  {
    version: '0.1.1',
    date: '2025-01-16',
    added: [
      'Real-time transit tracking with Passio GO integration',
      'METAR and TAF aviation weather for KSUX airport',
      'Refresh actions and freshness indicators on all widgets',
      'Widget freshness status (Live/Stale) based on data age',
    ],
    changed: [
      'Rebranded to Siouxland.online',
    ],
  },
  {
    version: '0.1.0',
    date: '2025-01-15',
    added: [
      'Initial release',
      'Interactive map with multiple data layers',
      'Traffic cameras (Iowa DOT + KTIV)',
      'Emergency scanner audio feeds',
      'Weather conditions and alerts from NWS',
      'River gauge monitoring (Missouri & Big Sioux)',
      'Air quality readings from AirNow',
      'Flight information for SUX airport',
      'Power outage tracking',
      'Earthquake monitoring',
      'Local news aggregation',
      'Drag-and-drop widget reordering',
      'Widget visibility settings',
      'Dark/Light theme support',
      'Responsive design with mobile navigation',
    ],
  },
]

interface ChangelogModalProps {
  children: React.ReactNode
}

export function ChangelogModal({ children }: ChangelogModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            What&apos;s New
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {CHANGELOG.map((release, index) => (
              <div key={release.version} className={cn(
                "relative",
                index !== CHANGELOG.length - 1 && "pb-6 border-b"
              )}>
                {/* Version header */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="text-sm">
                    v{release.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                  {index === 0 && (
                    <Badge variant="outline" className="text-[10px] text-green-500 border-green-500">
                      Latest
                    </Badge>
                  )}
                </div>

                {/* Added */}
                {release.added && release.added.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-500 mb-1.5">
                      <Plus className="h-3 w-3" />
                      Added
                    </div>
                    <ul className="space-y-1">
                      {release.added.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Changed */}
                {release.changed && release.changed.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 mb-1.5">
                      <RefreshCw className="h-3 w-3" />
                      Changed
                    </div>
                    <ul className="space-y-1">
                      {release.changed.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fixed */}
                {release.fixed && release.fixed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-orange-500 mb-1.5">
                      <Bug className="h-3 w-3" />
                      Fixed
                    </div>
                    <ul className="space-y-1">
                      {release.fixed.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-orange-500/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
