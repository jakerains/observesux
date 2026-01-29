'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Plus,
  ArrowLeft,
  List,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useEvents } from '@/lib/hooks/useDataFetching'
import { useSession } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { EVENT_CATEGORIES } from '@/types'
import type { CommunityEvent } from '@/types'
import {
  parseEventDate,
  isEventInRange,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
} from '@/lib/utils/dateParser'

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'Explore Siouxland', label: 'Explore Siouxland' },
  { value: 'Hard Rock Casino', label: 'Hard Rock Casino' },
  { value: 'Tyson Events Center', label: 'Tyson Events Center' },
  { value: 'Community', label: 'Community' },
]

const SOURCE_COLORS: Record<string, string> = {
  'Explore Siouxland': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'Hard Rock Casino': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'Tyson Events Center': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'Community': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
}

const DATE_PRESETS = [
  { value: 'all', label: 'All Dates' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

type ViewMode = 'list' | 'calendar'

// ============================================
// Event Card (List View)
// ============================================
function EventCard({ event }: { event: CommunityEvent }) {
  const sourceColor = SOURCE_COLORS[event.source || ''] || 'bg-muted text-muted-foreground'

  return (
    <div className="group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-snug">{event.title}</h3>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <span className="text-xs text-muted-foreground">{event.date}</span>
          {event.time && <span className="text-xs text-muted-foreground">at {event.time}</span>}
          {event.location && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {event.location}
            </span>
          )}
          {event.source && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sourceColor}`}>
              {event.source}
            </Badge>
          )}
        </div>

        {event.description && (
          <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================
// Calendar View
// ============================================
function CalendarView({ events }: { events: CommunityEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = currentMonth.getDay()

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map: Record<number, CommunityEvent[]> = {}
    events.forEach(event => {
      const date = parseEventDate(event.date)
      if (date && date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
        const day = date.getDate()
        if (!map[day]) map[day] = []
        map[day].push(event)
      }
    })
    return map
  }, [events, currentMonth])

  const today = new Date()
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border/50 rounded-lg overflow-hidden">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-background min-h-[80px] sm:min-h-[100px] p-1" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = eventsByDay[day] || []
          const isToday = isCurrentMonth && today.getDate() === day

          return (
            <div
              key={day}
              className={cn(
                'bg-background min-h-[80px] sm:min-h-[100px] p-1 relative',
                isToday && 'ring-2 ring-primary ring-inset'
              )}
            >
              <span className={cn(
                'text-xs font-medium',
                isToday ? 'text-primary font-bold' : 'text-muted-foreground'
              )}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((event, j) => {
                  const sourceColor = event.source === 'Explore Siouxland' ? 'bg-emerald-500'
                    : event.source === 'Hard Rock Casino' ? 'bg-orange-500'
                    : event.source === 'Tyson Events Center' ? 'bg-blue-500'
                    : event.source === 'Community' ? 'bg-purple-500'
                    : 'bg-primary'
                  return (
                    <div
                      key={j}
                      className={cn('rounded px-1 py-0.5 text-[10px] leading-tight text-white truncate', sourceColor)}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Submit Event Dialog
// ============================================
function SubmitEventDialog() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')

  const resetForm = () => {
    setTitle('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setDescription('')
    setUrl('')
    setCategory('general')
    setError(null)
    setSubmitted(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          location: location || undefined,
          description: description || undefined,
          url: url || undefined,
          category,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit event')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Submit Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Submit an Event
          </DialogTitle>
          <DialogDescription>
            Share a community event. Submissions are reviewed before appearing publicly.
          </DialogDescription>
        </DialogHeader>

        {!session?.user ? (
          <div className="text-center py-8">
            <LogIn className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to submit events to the community calendar.
            </p>
            <Button asChild>
              <a href="/auth/sign-in">Sign In</a>
            </Button>
          </div>
        ) : submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
            <p className="font-medium mb-1">Event Submitted!</p>
            <p className="text-sm text-muted-foreground">
              Your event will appear after admin review. Thank you!
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { resetForm(); setOpen(false) }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event name"
                maxLength={200}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="event-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="event-start">Start Time</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">End Time</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Venue or address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell people about this event..."
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-url">Website / Link</Label>
              <Input
                id="event-url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" disabled={submitting} className="w-full gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Submit for Review
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Main Events Page
// ============================================
export default function EventsPage() {
  const { data: eventsData, isLoading } = useEvents()
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [datePreset, setDatePreset] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mounted, setMounted] = useState(false)

  // Defer Radix UI components until after hydration to prevent ID mismatch
  useEffect(() => { setMounted(true) }, [])

  const allEvents = eventsData?.data?.events || []

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = allEvents

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter(e => e.source === sourceFilter)
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      )
    }

    // Date preset filter
    if (datePreset !== 'all') {
      const now = new Date()
      let from: Date
      let to: Date
      if (datePreset === 'week') {
        from = getStartOfWeek(now)
        to = getEndOfWeek(now)
      } else {
        from = getStartOfMonth(now)
        to = getEndOfMonth(now)
      }
      result = result.filter(e => isEventInRange(e.date, from, to))
    }

    return result
  }, [allEvents, sourceFilter, searchQuery, datePreset])

  // Get unique sources for filter display
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allEvents.forEach(e => {
      const src = e.source || 'Unknown'
      counts[src] = (counts[src] || 0) + 1
    })
    return counts
  }, [allEvents])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Community Events
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${allEvents.length} events from ${Object.keys(sourceCounts).length} sources`}
                </p>
              </div>
            </div>
            {mounted && <SubmitEventDialog />}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="pl-9"
            />
          </div>

          {/* Source Filter */}
          {mounted ? (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.value !== 'all' && sourceCounts[opt.value] !== undefined && (
                      <span className="text-muted-foreground ml-1">({sourceCounts[opt.value]})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-full sm:w-[200px] h-9 rounded-md border bg-background" />
          )}

          {/* Date Preset */}
          {mounted ? (
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-full sm:w-[160px] h-9 rounded-md border bg-background" />
          )}

          {/* View Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none gap-1.5"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none gap-1.5"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {isLoading ? (
          <div className="border rounded-lg divide-y">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="py-3 px-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView events={filteredEvents} />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground mb-2">No events found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || sourceFilter !== 'all' || datePreset !== 'all'
                ? 'Try adjusting your filters'
                : 'Check back later for upcoming events'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {filteredEvents.map((event, i) => (
              <EventCard key={`${event.title}-${i}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
