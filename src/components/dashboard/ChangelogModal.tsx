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
