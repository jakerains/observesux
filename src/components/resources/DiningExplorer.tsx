'use client'

import { useState, useMemo, useCallback } from 'react'
import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  ExternalLink,
  Search,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApiResponse, LocalEatsData, LocalEatsRestaurant } from '@/types'

// ============================================
// Constants
// ============================================

const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'review_count', label: 'Most Reviewed' },
  { value: 'distance', label: 'Distance' },
] as const

const PRICE_FILTERS = [
  { value: '1', label: '$' },
  { value: '2', label: '$$' },
  { value: '3', label: '$$$' },
  { value: '4', label: '$$$$' },
] as const

const CATEGORY_PRESETS = [
  { alias: 'restaurants', label: 'All' },
  { alias: 'newamerican', label: 'American' },
  { alias: 'mexican', label: 'Mexican' },
  { alias: 'italian', label: 'Italian' },
  { alias: 'chinese', label: 'Chinese' },
  { alias: 'pizza', label: 'Pizza' },
  { alias: 'burgers', label: 'Burgers' },
  { alias: 'bbq', label: 'BBQ' },
  { alias: 'breakfast_brunch', label: 'Breakfast' },
  { alias: 'coffee', label: 'Coffee' },
  { alias: 'bars', label: 'Bars' },
  { alias: 'breweries', label: 'Breweries' },
  { alias: 'steak', label: 'Steakhouses' },
  { alias: 'seafood', label: 'Seafood' },
  { alias: 'japanese', label: 'Japanese' },
  { alias: 'thai', label: 'Thai' },
  { alias: 'sandwiches', label: 'Sandwiches' },
  { alias: 'desserts', label: 'Desserts' },
] as const

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ============================================
// Star Rating (compact)
// ============================================

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

// ============================================
// Restaurant Row (compact — matches dashboard widget style)
// ============================================

function RestaurantRow({ restaurant }: { restaurant: LocalEatsRestaurant }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
      {restaurant.imageUrl && (
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
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
              <span className="text-muted-foreground/40">&middot;</span>
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
          {restaurant.location.address1 && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span className="text-[10px] text-muted-foreground/70 truncate">
                {restaurant.location.address1}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function DiningExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [sortBy, setSortBy] = useState('best_match')
  const [priceFilter, setPriceFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('restaurants')

  // Build the API URL from current filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      sort_by: sortBy,
      limit: '20',
    })

    if (activeSearch) {
      params.set('term', activeSearch)
    } else if (categoryFilter && categoryFilter !== 'restaurants') {
      params.set('category', categoryFilter)
    }

    if (priceFilter) {
      params.set('price', priceFilter)
    }

    return `/api/local-eats?${params}`
  }, [sortBy, activeSearch, priceFilter, categoryFilter])

  const { data: response, error, isLoading, isValidating } = useSWR<ApiResponse<LocalEatsData>>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 1800000,
      dedupingInterval: 300000,
      revalidateOnFocus: false,
    }
  )

  const restaurants = response?.data?.restaurants ?? []

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchTerm.trim())
    if (searchTerm.trim()) {
      setCategoryFilter('restaurants')
    }
  }, [searchTerm])

  const handleCategoryChange = useCallback((alias: string) => {
    setCategoryFilter(alias)
    setSearchTerm('')
    setActiveSearch('')
  }, [])

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </form>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price + Category chips (single scrollable row) */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {PRICE_FILTERS.map(pf => (
          <button
            key={pf.value}
            onClick={() => setPriceFilter(priceFilter === pf.value ? '' : pf.value)}
            className={cn(
              "px-2 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
              priceFilter === pf.value
                ? "bg-emerald-500 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {pf.label}
          </button>
        ))}
        <div className="w-px bg-border shrink-0 mx-0.5" />
        {CATEGORY_PRESETS.map(cat => (
          <button
            key={cat.alias}
            onClick={() => handleCategoryChange(cat.alias)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
              categoryFilter === cat.alias && !activeSearch
                ? "bg-orange-500 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active search indicator */}
      {activeSearch && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Results for &ldquo;{activeSearch}&rdquo;</span>
          <button
            onClick={() => { setSearchTerm(''); setActiveSearch('') }}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Results — scrollable, fixed height */}
      {isLoading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 px-2">
              <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Unable to load restaurants</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Try refreshing or check back later</p>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No restaurants found</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Try a different search or category</p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
          {restaurants.map((restaurant) => (
            <RestaurantRow key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1.5">
          {restaurants.length > 0 && `${restaurants.length} restaurants`}
          {isValidating && !isLoading && (
            <RefreshCw className="h-3 w-3 animate-spin" />
          )}
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
    </div>
  )
}
