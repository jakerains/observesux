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
    version: '0.1.7',
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
