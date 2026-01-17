'use client'

import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Newspaper, ExternalLink, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useSWR from 'swr'
import { RefreshAction } from './RefreshAction'

interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: string
  source: string
  category?: string
}

interface NewsResponse {
  data: NewsItem[]
  timestamp: string
  source: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getSourceColor(source: string): string {
  switch (source) {
    case 'KTIV':
      return 'bg-blue-500'
    case 'Siouxland Proud':
      return 'bg-purple-500'
    case 'Sioux City Journal':
      return 'bg-green-600'
    default:
      return 'bg-gray-500'
  }
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
      className="block p-3 hover:bg-muted/50 rounded-lg transition-colors group border-b last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 text-white border-0 ${getSourceColor(item.source)}`}
        >
          {item.source}
        </Badge>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
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
  const { data: newsData, error, isLoading, isValidating, mutate: refreshNews } = useSWR<NewsResponse>(
    '/api/news',
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 60000,
      revalidateOnFocus: false
    }
  )

  const news = newsData?.data || []
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
      {news.length > 0 ? (
        <ScrollArea className="h-[300px] -mx-2">
          <div className="px-2">
            {news.map((item) => (
              <NewsItemRow key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Newspaper className="h-8 w-8 mx-auto mb-2" />
          <p>No news available</p>
          <p className="text-xs">Check back later</p>
        </div>
      )}

      {/* Source Attribution */}
      <div className="mt-3 pt-2 border-t flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span>Sources:</span>
        <Badge variant="outline" className="text-[10px] bg-blue-500/10">KTIV</Badge>
        <Badge variant="outline" className="text-[10px] bg-purple-500/10">Siouxland Proud</Badge>
        <Badge variant="outline" className="text-[10px] bg-green-600/10">SC Journal</Badge>
      </div>
    </DashboardCard>
  )
}
