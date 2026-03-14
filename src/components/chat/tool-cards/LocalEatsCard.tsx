import { UtensilsCrossed, Star, Phone, MapPin, ExternalLink } from 'lucide-react'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'

interface RestaurantResult {
  name: string
  rating: number
  reviewCount: number
  price: string
  categories: string
  phone: string
  address: string
  yelpUrl: string
  id: string
}

type LocalEatsToolOutput =
  | { restaurants: RestaurantResult[]; total: number; source: string }
  | { message: string }
  | { error: string }

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            rating >= i
              ? 'fill-amber-400 text-amber-400'
              : rating >= i - 0.5
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

function RestaurantRow({ r }: { r: RestaurantResult }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={r.yelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
          >
            {r.name}
          </a>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StarDisplay rating={r.rating} />
            <span className="text-[10px] text-muted-foreground">({r.reviewCount})</span>
            {r.price !== 'N/A' && (
              <span className="text-[10px] text-muted-foreground ml-1">{r.price}</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{r.categories}</div>
        </div>
        <a
          href={r.yelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
        {r.phone && (
          <a href={`tel:${r.phone}`} className="flex items-center gap-0.5 hover:text-foreground">
            <Phone className="h-2.5 w-2.5" />
            {r.phone}
          </a>
        )}
        {r.address && (
          <span className="flex items-center gap-0.5 truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{r.address}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export function LocalEatsCard({ data, error, state }: ToolCardProps<LocalEatsToolOutput>) {
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Local Eats"
        icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  if ('message' in data) {
    return (
      <ToolCardWrapper
        title="Local Eats"
        icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
      >
        <p className="text-sm text-muted-foreground">{data.message}</p>
      </ToolCardWrapper>
    )
  }

  const { restaurants, total } = data as { restaurants: RestaurantResult[]; total: number }

  return (
    <ToolCardWrapper
      title="Local Eats"
      icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      <div className="space-y-2">
        {restaurants.slice(0, 5).map((r) => (
          <RestaurantRow key={r.id} r={r} />
        ))}
      </div>

      {restaurants.length > 5 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          +{restaurants.length - 5} more of {total} total
        </div>
      )}

      <div className="mt-2 text-[10px] text-muted-foreground/60 text-center">
        Powered by Yelp
      </div>
    </ToolCardWrapper>
  )
}
