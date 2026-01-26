'use client'

import { useState, useMemo } from 'react'
import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Newspaper, ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useSWR from 'swr'
import { RefreshAction } from './RefreshAction'
import { NEWS_CATEGORIES, type NewsCategory } from '@/types'
import { cn } from '@/lib/utils'

interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: string
  source: string
  category?: string
  isBreaking?: boolean
}

interface NewsResponse {
  data: NewsItem[]
  timestamp: string
  source: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Check if a news item matches a category based on keywords
function matchesCategory(item: NewsItem, categoryId: NewsCategory): boolean {
  if (categoryId === 'all') return true

  const category = NEWS_CATEGORIES.find(c => c.id === categoryId)
  if (!category || category.keywords.length === 0) return true

  const textToCheck = `${item.title} ${item.description || ''}`.toLowerCase()
  return category.keywords.some(keyword => textToCheck.includes(keyword.toLowerCase()))
}

// Filter out ordinary obituaries (keep notable/celebrity obits)
function isObituary(item: NewsItem): boolean {
  const text = `${item.title} ${item.description || ''}`.toLowerCase()

  // Obituary indicators
  const obitKeywords = [
    'obituary', 'obituaries', 'obit:',
    'dies at', 'died at', 'has died', 'have died',
    'passed away', 'passes away',
    'funeral service', 'memorial service',
    'in loving memory', 'rest in peace',
    'survived by', 'preceded in death'
  ]

  const isObit = obitKeywords.some(keyword => text.includes(keyword))

  if (!isObit) return false

  // Notable person indicators - keep these obituaries
  const notableKeywords = [
    'former president', 'former governor', 'senator', 'congressman',
    'celebrity', 'star', 'famous', 'legendary', 'icon', 'renowned',
    'hall of fame', 'grammy', 'oscar', 'emmy', 'tony award',
    'nfl', 'nba', 'mlb', 'nhl', 'olympic',
    'billionaire', 'ceo of', 'founder of',
    'pulitzer', 'nobel'
  ]

  const isNotable = notableKeywords.some(keyword => text.includes(keyword))

  // Return true if it's an ordinary obit (not notable) - these get filtered out
  return !isNotable
}

function getSourceColor(source: string): string {
  const lowerSource = source.toLowerCase()

  // Match variations of source names
  if (lowerSource.includes('siouxland proud') || lowerSource.includes('kcau')) {
    return 'bg-purple-500'
  }
  if (lowerSource.includes('sioux city journal') || lowerSource.includes('siouxcityjournal')) {
    return 'bg-green-600'
  }
  if (lowerSource.includes('ktiv')) {
    return 'bg-blue-500'
  }

  // Default for Google News aggregated sources
  return 'bg-gray-500'
}

interface NewsItemRowProps {
  item: NewsItem
}

function NewsItemRow({ item }: NewsItemRowProps) {
  const isBreaking = item.isBreaking

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block p-3 hover:bg-muted/50 rounded-lg transition-colors group border-b last:border-b-0",
        isBreaking && "border-l-2 border-l-red-500 bg-red-500/5 hover:bg-red-500/10"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 shrink-0">
          {isBreaking && (
            <Badge
              variant="destructive"
              className="text-[9px] px-1.5 py-0 animate-pulse flex items-center gap-1"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              BREAKING
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 text-white border-0 ${getSourceColor(item.source)}`}
          >
            {item.source}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2",
            isBreaking ? "font-semibold" : "font-medium"
          )}>
            {item.title}
            <ExternalLink className="inline-block h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h4>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
            {item.category && (
              <>
                <span>·</span>
                <span className="capitalize">{item.category}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

export function NewsWidget() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all')

  const { data: newsData, error, isLoading, isValidating, mutate: refreshNews } = useSWR<NewsResponse>(
    '/api/news',
    fetcher,
    {
      refreshInterval: 120000, // 2 minutes
      dedupingInterval: 60000,
      revalidateOnFocus: false
    }
  )

  const allNews = newsData?.data || []

  // Filter out ordinary obituaries first
  const filteredNews = useMemo(() => {
    return allNews.filter(item => !isObituary(item))
  }, [allNews])

  // Then apply category filter
  const news = useMemo(() => {
    return filteredNews.filter(item => matchesCategory(item, selectedCategory))
  }, [filteredNews, selectedCategory])

  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refreshNews()}
      isLoading={isLoading}
      isValidating={isValidating}
      label="Refresh news"
    />
  )

  if (isLoading) {
    return (
      <DashboardCard
        title="Local News"
        icon={<Newspaper className="h-4 w-4" />}
        status="loading"
        action={refreshAction}
      >
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Local News"
      icon={<Newspaper className="h-4 w-4" />}
      status={status}
      lastUpdated={newsData?.timestamp ? new Date(newsData.timestamp) : undefined}
      action={refreshAction}
    >
      <div>
        {/* Category Filter Pills */}
        <div className="mb-3 -mx-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 px-2 pb-1">
              {NEWS_CATEGORIES.map((category) => {
                const isActive = selectedCategory === category.id
                const matchCount = category.id === 'all'
                  ? filteredNews.length
                  : filteredNews.filter(item => matchesCategory(item, category.id)).length

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors shrink-0",
                      isActive
                        ? `${category.color} text-white`
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {category.label}
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-white/20" : "bg-background"
                    )}>
                      {matchCount}
                    </span>
                  </button>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </div>

        {/* News List - scrollable area */}
        {news.length > 0 ? (
          <div className="max-h-[240px] overflow-y-auto -mx-2 px-2">
            {news.map((item) => (
              <NewsItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-8">
            <div>
              <Newspaper className="h-8 w-8 mx-auto mb-2" />
              <p>No news in {NEWS_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'this category'}</p>
              <p className="text-xs">Try another category or check back later</p>
            </div>
          </div>
        )}

        {/* Source Attribution */}
        <div className="mt-3 pt-2 border-t flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span className="self-center">Sources:</span>
          <Badge variant="outline" className="text-[10px] bg-purple-500/10">Siouxland Proud</Badge>
          <Badge variant="outline" className="text-[10px] bg-green-600/10">SC Journal</Badge>
          <Badge variant="outline" className="text-[10px] bg-gray-500/10">Google News</Badge>
        </div>
      </div>
    </DashboardCard>
  )
}
