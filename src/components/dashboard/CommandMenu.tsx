'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Cloud,
  Map,
  Camera,
  FileText,
  Newspaper,
  Landmark,
  Car,
  Waves,
  Wind,
  Bus,
  Zap,
  Fuel,
  Utensils,
  CalendarDays,
  Flower2,
  Sun,
  Plane,
  CloudSun,
  Radio,
  Activity,
  Sparkles,
  RefreshCw,
  MessageCircle,
  ScrollText,
  Lightbulb,
  Clipboard,
  ArrowUp,
  Home,
  BookOpen,
  Settings,
  Bell,
  Heart,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { scrollToWidget } from '@/lib/utils/scrollToWidget'
import { useChatSheet } from '@/lib/contexts/ChatContext'
import { track } from '@vercel/analytics'

interface CommandMenuProps {
  onRefresh?: () => void
}

const WIDGETS = [
  { id: 'weather', label: 'Weather / Current Conditions', icon: Cloud, keywords: ['temperature', 'forecast', 'hero', 'conditions'] },
  { id: 'digest', label: 'Daily Digest', icon: FileText, keywords: ['summary', 'briefing', 'morning'] },
  { id: 'map', label: 'Interactive Map', icon: Map, keywords: ['area', 'roads', 'traffic', 'road conditions'] },
  { id: 'cameras', label: 'Traffic Cameras', icon: Camera, keywords: ['live', 'video', 'dot', 'highway'] },
  { id: 'forecast', label: 'Weather Forecast', icon: CloudSun, keywords: ['week', 'tomorrow', 'rain', 'snow'] },
  { id: 'news', label: 'Local News', icon: Newspaper, keywords: ['ktiv', 'headlines', 'local proud'] },
  { id: 'council', label: 'City Council', icon: Landmark, keywords: ['government', 'meeting', 'recap', 'city hall'] },
  { id: 'traffic', label: 'Traffic Events', icon: Car, keywords: ['incidents', 'accidents', 'construction', 'road work'] },
  { id: 'river', label: 'River Levels', icon: Waves, keywords: ['missouri', 'flood', 'gauge', 'river'] },
  { id: 'air-quality', label: 'Air Quality', icon: Wind, keywords: ['aqi', 'pollution', 'airnow', 'ozone'] },
  { id: 'transit', label: 'Transit', icon: Bus, keywords: ['bus', 'city transit', 'route', 'passio'] },
  { id: 'outages', label: 'Power Outages', icon: Zap, keywords: ['electric', 'midamerican', 'outage map'] },
  { id: 'gas-prices', label: 'Gas Prices', icon: Fuel, keywords: ['fuel', 'gasoline', 'cheap gas', 'station'] },
  { id: 'local-eats', label: 'Local Eats', icon: Utensils, keywords: ['restaurants', 'food', 'dining', 'yelp', 'pizza'] },
  { id: 'events', label: 'Community Events', icon: CalendarDays, keywords: ['calendar', 'things to do', 'local'] },
  { id: 'pollen', label: 'Pollen & Allergy', icon: Flower2, keywords: ['allergy', 'grass', 'tree', 'ragweed'] },
  { id: 'sun', label: 'Sun & Daylight', icon: Sun, keywords: ['sunrise', 'sunset', 'golden hour', 'daylight'] },
  { id: 'flights', label: 'Flight Board', icon: Plane, keywords: ['airport', 'departures', 'arrivals', 'gateway'] },
  { id: 'aviation-weather', label: 'Aviation Weather', icon: CloudSun, keywords: ['metar', 'taf', 'pilot', 'ceiling'] },
  { id: 'scanner', label: 'Police Scanner', icon: Radio, keywords: ['broadcastify', 'fire', 'ems', 'dispatch'] },
  { id: 'earthquakes', label: 'Earthquakes', icon: Activity, keywords: ['usgs', 'seismic', 'quake'] },
  { id: 'aurora', label: 'Aurora Watch', icon: Sparkles, keywords: ['northern lights', 'kp index', 'noaa', 'solar'] },
]

const PAGES = [
  { label: 'Home / Dashboard', href: '/', icon: Home },
  { label: 'Daily Digest', href: '/digest', icon: FileText },
  { label: 'Local Resources', href: '/resources', icon: BookOpen },
  { label: 'City Council', href: '/council', icon: Landmark },
  { label: 'Community Events', href: '/events', icon: CalendarDays },
  { label: 'Account Settings', href: '/account/settings', icon: Settings },
  { label: 'Alert Preferences', href: '/account/alerts', icon: Bell },
  { label: 'Watchlist', href: '/account/watchlist', icon: Heart },
]

export function CommandMenu({ onRefresh }: CommandMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { openChat } = useChatSheet()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Listen for custom event from header button
  useEffect(() => {
    const handler = () => setOpen(true)
    document.addEventListener('open-command-palette', handler)
    return () => document.removeEventListener('open-command-palette', handler)
  }, [])

  const handleWidgetSelect = useCallback((widgetId: string) => {
    setOpen(false)
    track('command_palette_widget', { widget: widgetId })

    if (pathname !== '/') {
      router.push(`/#${widgetId}`)
    } else {
      // Small delay to let the dialog close animation finish
      setTimeout(() => scrollToWidget(widgetId), 150)
    }
  }, [pathname, router])

  const handlePageSelect = useCallback((href: string) => {
    setOpen(false)
    track('command_palette_page', { page: href })
    router.push(href)
  }, [router])

  const handleAction = useCallback((action: string) => {
    setOpen(false)
    track('command_palette_action', { action })

    switch (action) {
      case 'refresh':
        onRefresh?.()
        break
      case 'chat':
        openChat()
        break
      case 'changelog':
        document.dispatchEvent(new CustomEvent('open-changelog'))
        break
      case 'feedback':
        document.dispatchEvent(new CustomEvent('open-suggestion-modal'))
        break
      case 'copy-weather':
        copyCurrentWeather()
        break
      case 'scroll-top':
        window.scrollTo({ top: 0, behavior: 'smooth' })
        break
    }
  }, [onRefresh, openChat])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search widgets, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Widgets">
          {WIDGETS.map((widget) => {
            const Icon = widget.icon
            return (
              <CommandItem
                key={widget.id}
                value={`${widget.label} ${widget.keywords.join(' ')}`}
                onSelect={() => handleWidgetSelect(widget.id)}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{widget.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {PAGES.map((page) => {
            const Icon = page.icon
            return (
              <CommandItem
                key={page.href}
                value={page.label}
                onSelect={() => handlePageSelect(page.href)}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{page.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem value="Refresh All Data" onSelect={() => handleAction('refresh')}>
            <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Refresh All Data</span>
          </CommandItem>
          <CommandItem value="Open SUX Chat sux ai assistant" onSelect={() => handleAction('chat')}>
            <MessageCircle className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Open SUX Chat</span>
          </CommandItem>
          <CommandItem value="View Changelog What's New" onSelect={() => handleAction('changelog')}>
            <ScrollText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>View Changelog</span>
          </CommandItem>
          <CommandItem value="Submit Feedback Suggestion" onSelect={() => handleAction('feedback')}>
            <Lightbulb className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Submit Feedback</span>
          </CommandItem>
          <CommandItem value="Copy Current Weather conditions" onSelect={() => handleAction('copy-weather')}>
            <Clipboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Copy Current Weather</span>
          </CommandItem>
          <CommandItem value="Scroll to Top" onSelect={() => handleAction('scroll-top')}>
            <ArrowUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Scroll to Top</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

async function copyCurrentWeather() {
  try {
    const res = await fetch('/api/weather')
    const data = await res.json()
    const obs = data?.current
    if (obs) {
      const text = `${obs.temperature ?? obs.temp ?? ''}°F, ${obs.conditions ?? obs.weather ?? obs.textDescription ?? 'N/A'} — Sioux City, IA`
      await navigator.clipboard.writeText(text)
    }
  } catch {
    // Silently fail — not critical
  }
}
