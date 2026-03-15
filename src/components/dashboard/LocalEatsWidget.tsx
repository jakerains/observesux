'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Skeleton } from "@/components/ui/skeleton"
import { useLocalEats } from '@/lib/hooks/useDataFetching'
import { UtensilsCrossed, Star, ExternalLink, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import type { LocalEatsRestaurant } from '@/types'

function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)
    } else if (rating >= i - 0.5) {
      stars.push(
        <div key={i} className="relative h-3 w-3">
          <Star className="absolute h-3 w-3 text-muted-foreground/30" />
          <div className="absolute overflow-hidden w-[50%]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
        </div>
      )
    } else {
      stars.push(<Star key={i} className="h-3 w-3 text-muted-foreground/30" />)
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>
}

function RestaurantRow({ restaurant }: { restaurant: LocalEatsRestaurant }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
      {restaurant.imageUrl && (
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
        />
      )}
      <div className="min-w-0 flex-1">
        <a
          href={restaurant.yelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
        >
          {restaurant.name}
        </a>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={restaurant.rating} />
          <span className="text-xs text-muted-foreground">
            {restaurant.reviewCount}
          </span>
          {restaurant.price && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{restaurant.price}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {restaurant.categories.slice(0, 2).map((cat) => (
            <span
              key={cat.alias}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {cat.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function LocalEatsWidget() {
  const refreshInterval = 1800000 // 30 min
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const searchTerm = debouncedSearch.trim() || undefined
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: eatsData, error, isLoading, isValidating, mutate: refreshEats } = useLocalEats(refreshInterval, searchTerm)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const clearSearch = useCallback(() => {
    setSearchInput('')
    setSelectedCategory(null)
    inputRef.current?.focus()
  }, [])

  const data = eatsData?.data
  const lastUpdated = eatsData?.timestamp ? new Date(eatsData.timestamp) : undefined

  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  // Extract top categories from results for filter chips
  const topCategories = useMemo(() => {
    if (!data?.restaurants) return []
    const counts = new Map<string, { alias: string; title: string; count: number }>()
    for (const r of data.restaurants) {
      for (const cat of r.categories) {
        const existing = counts.get(cat.alias)
        if (existing) {
          existing.count++
        } else {
          counts.set(cat.alias, { alias: cat.alias, title: cat.title, count: 1 })
        }
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [data?.restaurants])

  // Filter restaurants client-side
  const filteredRestaurants = useMemo(() => {
    if (!data?.restaurants) return []
    if (!selectedCategory) return data.restaurants
    return data.restaurants.filter(r =>
      r.categories.some(c => c.alias === selectedCategory)
    )
  }, [data?.restaurants, selectedCategory])

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refreshEats()}
      isLoading={isLoading}
      isValidating={isValidating}
    />
  )

  if (isLoading) {
    return (
      <DashboardCard title="Local Eats" icon={<UtensilsCrossed className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </DashboardCard>
    )
  }

  if (error || !data) {
    return (
      <DashboardCard title="Local Eats" icon={<UtensilsCrossed className="h-4 w-4" />} status="error" action={refreshAction}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Unable to load restaurant data</p>
          <p className="text-xs text-muted-foreground">Try refreshing or check back later</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Local Eats"
      icon={<UtensilsCrossed className="h-4 w-4" />}
      status={status}
      action={refreshAction}
    >
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setSelectedCategory(null)
          }}
          placeholder="Search pizza, tacos, burgers..."
          className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-muted/50 border border-transparent focus:border-orange-500/50 focus:bg-background text-sm placeholder:text-muted-foreground/60 outline-none transition-all"
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      {topCategories.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              selectedCategory === null
                ? "bg-orange-500 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            All
          </button>
          {topCategories.map(cat => (
            <button
              key={cat.alias}
              onClick={() => setSelectedCategory(selectedCategory === cat.alias ? null : cat.alias)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                selectedCategory === cat.alias
                  ? "bg-orange-500 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Restaurant List */}
      <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1">
        {filteredRestaurants.map((restaurant) => (
          <RestaurantRow key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No restaurants found
        </div>
      )}

      {/* Yelp Attribution (required by TOS) */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {searchTerm
            ? `${filteredRestaurants.length} result${filteredRestaurants.length !== 1 ? 's' : ''} for "${searchTerm}"`
            : `${data.restaurants.length} restaurants`
          }
        </span>
        <a
          href="https://www.yelp.com/search?find_desc=restaurants&find_loc=Sioux+City%2C+IA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Powered by Yelp
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </DashboardCard>
  )
}
