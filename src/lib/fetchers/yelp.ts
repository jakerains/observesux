/**
 * Yelp Fusion API — Top-rated Sioux City restaurants
 * Requires YELP_API_KEY environment variable (128-char Yelp Fusion / Places API key)
 * Free Base plan: 5,000 calls/month — rely on CDN caching (1hr s-maxage)
 */

import type { LocalEatsRestaurant, LocalEatsData } from '@/types'

const YELP_API_BASE = 'https://api.yelp.com/v3'

interface YelpBusiness {
  id: string
  name: string
  image_url: string
  url: string
  rating: number
  review_count: number
  categories: { alias: string; title: string }[]
  price?: string
  display_phone: string
  location: {
    address1: string
    city: string
    state: string
    zip_code: string
    display_address: string[]
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  is_closed: boolean
}

interface YelpBusinessDetails extends YelpBusiness {
  hours?: {
    open: {
      day: number
      start: string
      end: string
      is_overnight: boolean
    }[]
    hours_type: string
    is_open_now: boolean
  }[]
  photos?: string[]
}

interface YelpReview {
  id: string
  text: string
  rating: number
  time_created: string
  user: {
    name: string
    image_url?: string
  }
}

interface YelpSearchResponse {
  businesses: YelpBusiness[]
  total: number
}

function getApiKey(): string {
  const rawKey = process.env.YELP_API_KEY ?? ''
  const apiKey = rawKey.trim().replace(/^"|"$/g, '').replace(/\\n/g, '').replace(/\n/g, '').trim()

  if (!apiKey) {
    throw new Error('YELP_API_KEY is not configured')
  }

  // Yelp Fusion / Places API keys are exactly 128 alphanumeric characters.
  if (apiKey.length !== 128) {
    throw new Error(
      `YELP_API_KEY is ${apiKey.length} chars but Yelp requires exactly 128. ` +
      `Regenerate a Fusion/Places API key at https://www.yelp.com/developers/v3/manage_app`
    )
  }

  return apiKey
}

async function yelpFetch<T>(path: string): Promise<T> {
  const apiKey = getApiKey()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${YELP_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function normalizeRestaurant(biz: YelpBusiness): LocalEatsRestaurant {
  return {
    id: biz.id,
    name: biz.name,
    imageUrl: biz.image_url,
    yelpUrl: biz.url,
    rating: biz.rating,
    reviewCount: biz.review_count,
    categories: biz.categories.map(c => ({ alias: c.alias, title: c.title })),
    price: biz.price,
    displayPhone: biz.display_phone,
    location: {
      address1: biz.location.address1,
      city: biz.location.city,
      state: biz.location.state,
      zipCode: biz.location.zip_code,
      displayAddress: biz.location.display_address,
    },
    coordinates: {
      latitude: biz.coordinates.latitude,
      longitude: biz.coordinates.longitude,
    },
    isClosed: biz.is_closed,
  }
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatHour(hhmm: string): string {
  const h = parseInt(hhmm.slice(0, 2))
  const m = hhmm.slice(2)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === '00' ? `${h12}${suffix}` : `${h12}:${m}${suffix}`
}

// ──────────────────────────────────────────────
// Business Search (widget + chatbot)
// ──────────────────────────────────────────────

export async function fetchLocalEats(options?: {
  sortBy?: string
  category?: string
  term?: string
  price?: string
  limit?: number
}): Promise<LocalEatsData> {
  const params = new URLSearchParams({
    location: 'Sioux City, IA',
    sort_by: options?.sortBy || 'best_match',
    limit: String(options?.limit || 20),
  })

  if (options?.term) {
    params.set('term', options.term)
  } else {
    params.set('categories', 'restaurants,food')
  }

  if (options?.category) {
    params.set('categories', options.category)
  }

  if (options?.price) {
    params.set('price', options.price)
  }

  const data = await yelpFetch<YelpSearchResponse>(`/businesses/search?${params}`)

  const restaurants = data.businesses
    .filter(biz => !biz.is_closed)
    .map(normalizeRestaurant)

  return {
    restaurants,
    total: data.total,
  }
}

// ──────────────────────────────────────────────
// Business Details (chatbot — "is X open?")
// ──────────────────────────────────────────────

export interface RestaurantDetails extends LocalEatsRestaurant {
  isOpenNow: boolean | null
  hours: Record<string, string> | null
  photos: string[]
}

export async function fetchRestaurantDetails(businessId: string): Promise<RestaurantDetails> {
  const biz = await yelpFetch<YelpBusinessDetails>(`/businesses/${encodeURIComponent(businessId)}`)

  const hoursData = biz.hours?.[0]
  let weeklyHours: Record<string, string> | null = null

  if (hoursData?.open) {
    weeklyHours = {}
    for (const slot of hoursData.open) {
      const day = DAY_NAMES[slot.day]
      const range = `${formatHour(slot.start)}-${formatHour(slot.end)}`
      weeklyHours[day] = weeklyHours[day] ? `${weeklyHours[day]}, ${range}` : range
    }
  }

  return {
    ...normalizeRestaurant(biz),
    isOpenNow: hoursData?.is_open_now ?? null,
    hours: weeklyHours,
    photos: biz.photos ?? [],
  }
}

// ──────────────────────────────────────────────
// Reviews (chatbot — "what do people say about X?")
// ──────────────────────────────────────────────

export interface RestaurantReview {
  text: string
  rating: number
  date: string
  userName: string
}

export async function fetchRestaurantReviews(businessId: string): Promise<RestaurantReview[]> {
  const data = await yelpFetch<{ reviews: YelpReview[] }>(
    `/businesses/${encodeURIComponent(businessId)}/reviews?sort_by=yelp_sort&limit=3`
  )

  return data.reviews.map(r => ({
    text: r.text,
    rating: r.rating,
    date: r.time_created,
    userName: r.user.name,
  }))
}

// ──────────────────────────────────────────────
// Delivery Search (chatbot — "what delivers?")
// ──────────────────────────────────────────────

export async function fetchDeliveryRestaurants(): Promise<LocalEatsData> {
  const params = new URLSearchParams({
    latitude: '42.4969',
    longitude: '-96.4003',
  })

  const data = await yelpFetch<YelpSearchResponse>(
    `/transactions/delivery/search?${params}`
  )

  const restaurants = data.businesses
    .filter(biz => !biz.is_closed)
    .map(normalizeRestaurant)

  return {
    restaurants,
    total: data.total,
  }
}
