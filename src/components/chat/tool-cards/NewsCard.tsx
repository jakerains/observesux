import { Newspaper, ExternalLink, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'

interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: Date | string
  source: string
  category?: string
}

interface NewsApiResponse {
  data: NewsItem[]
  timestamp: Date
  source: string
  error?: string
}

type NewsToolOutput = NewsApiResponse | { error: string }

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

interface NewsItemRowProps {
  item: NewsItem
}

function NewsItemRow({ item }: NewsItemRowProps) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-2 rounded-lg hover:bg-muted/70 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.source}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {formatTimeAgo(item.pubDate)}
            </span>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  )
}

export function NewsCard({ data, error, state }: ToolCardProps<NewsToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string' && !('data' in data)) {
    return (
      <ToolCardWrapper
        title="Local News"
        icon={<Newspaper className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const newsData = data as NewsApiResponse
  const newsItems = newsData?.data || []

  if (newsItems.length === 0) {
    return (
      <ToolCardWrapper
        title="Local News"
        icon={<Newspaper className="h-3.5 w-3.5" />}
        error="No news available"
      />
    )
  }

  return (
    <ToolCardWrapper
      title="Local News"
      icon={<Newspaper className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Headline count */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed">
        <div className="text-sm font-medium">Latest Headlines</div>
        <Badge variant="secondary" className="text-xs">
          {newsItems.length} stories
        </Badge>
      </div>

      {/* News list */}
      <div className="space-y-1 -mx-1">
        {newsItems.slice(0, 5).map(item => (
          <NewsItemRow key={item.id} item={item} />
        ))}
      </div>

      {newsItems.length > 5 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          +{newsItems.length - 5} more headline{newsItems.length - 5 !== 1 ? 's' : ''}
        </div>
      )}
    </ToolCardWrapper>
  )
}
