import { tool } from 'ai';
import { z } from 'zod';
import Firecrawl from '@mendable/firecrawl-js';

// Get the base URL for API calls (works on server side)
function getBaseUrl(): string {
  // 1. Explicit base URL (highest priority)
  const explicitBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicitBaseUrl) {
    console.log('[AI Tools] Using NEXT_PUBLIC_BASE_URL:', explicitBaseUrl);
    return explicitBaseUrl;
  }

  // 2. Vercel production URL (for production deployments)
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProdUrl) {
    const url = `https://${vercelProdUrl}`;
    console.log('[AI Tools] Using VERCEL_PROJECT_PRODUCTION_URL:', url);
    return url;
  }

  // 3. Vercel URL (for preview deployments)
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const isLocalhost =
      vercelUrl.startsWith('localhost') ||
      vercelUrl.startsWith('127.0.0.1') ||
      vercelUrl.startsWith('0.0.0.0') ||
      vercelUrl.startsWith('[::1]');
    const url = `${isLocalhost ? 'http' : 'https'}://${vercelUrl}`;
    console.log('[AI Tools] Using VERCEL_URL:', url);
    return url;
  }

  // 4. Fallback to localhost
  console.log('[AI Tools] No Vercel URLs found, using localhost');
  return 'http://localhost:3000';
}

// Helper to fetch from internal API routes
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    console.log(`[AI Tools] Fetching: ${url}`);
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response body');
      console.error(`[AI Tools] API error for ${endpoint}: ${response.status} ${response.statusText}`, errorText.slice(0, 200));
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`[AI Tools] Failed to fetch ${endpoint}:`, error instanceof Error ? error.message : error);
    console.error(`[AI Tools] Attempted URL: ${url}`);
    return null;
  }
}

type CouncilSearchResult = {
  content: string;
  meetingTitle: string;
  meetingDate: string | null;
  youtubeLink: string;
  similarity: number;
};

type NewsItem = {
  title: string;
  description?: string;
  link: string;
  pubDate: string;
  source: string;
};

const SEARCH_STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'any', 'are', 'around', 'at', 'be', 'been', 'being',
  'but', 'by', 'can', 'city', 'council', 'did', 'do', 'for', 'from', 'going', 'happening',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'know', 'latest', 'me',
  'meeting', 'meetings', 'new', 'news', 'of', 'on', 'or', 'recent', 'regarding', 's',
  'said', 'should', 'something', 'tell', 'that', 'the', 'there', 'these', 'they', 'this',
  'to', 'us', 'was', 'what', 'whats', 'when', 'where', 'with', 'you',
]);

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSearchTerms(query: string): string[] {
  return normalizeSearchText(query)
    .split(' ')
    .filter(term => term.length > 2 && !SEARCH_STOP_WORDS.has(term));
}

function buildCouncilSearchQueries(query: string): string[] {
  const normalizedQuery = query.trim();
  const terms = extractSearchTerms(query);
  const topicQuery = terms.join(' ').trim();
  const variants = [
    normalizedQuery,
    terms.length <= 2 && topicQuery ? `${topicQuery} city council` : '',
    terms.length <= 2 && topicQuery ? `${topicQuery} budget` : '',
    topicQuery && topicQuery !== normalizedQuery ? topicQuery : '',
  ];

  return Array.from(
    new Set(
      variants
        .map(value => value.trim())
        .filter(Boolean)
    )
  );
}

function mergeCouncilResults(resultSets: CouncilSearchResult[][]): CouncilSearchResult[] {
  const merged = new Map<string, CouncilSearchResult>();

  for (const results of resultSets) {
    for (const result of results) {
      const key = `${result.youtubeLink}-${result.content.slice(0, 80)}`;
      const existing = merged.get(key);
      if (!existing || result.similarity > existing.similarity) {
        merged.set(key, result);
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

function scoreNewsItem(item: NewsItem, terms: string[], normalizedQuery: string): number {
  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description || '');
  const combined = `${title} ${description}`.trim();

  let score = 0;

  if (normalizedQuery && combined.includes(normalizedQuery)) {
    score += 10;
  }

  for (const term of terms) {
    if (title.includes(term)) score += 4;
    if (description.includes(term)) score += 2;
  }

  return score;
}

export const chatTools = {
  getCitySummary: tool({
    description: 'Get a comprehensive summary of current conditions in Sioux City including weather, river levels, air quality, traffic incidents, and any anomalies or alerts. Use this for general "what\'s happening" questions.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/city-summary');
      if (!data) {
        return { error: 'Unable to fetch city summary at this time' };
      }
      return data;
    },
  }),

  getCurrentWeather: tool({
    description: 'Get current weather conditions in Sioux City including temperature, humidity, wind, visibility, and conditions.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather');
      if (!data) {
        return { error: 'Unable to fetch weather data at this time' };
      }
      return data;
    },
  }),

  getWeatherAlerts: tool({
    description: 'Get active weather alerts and warnings for the Sioux City area from the National Weather Service.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather/alerts');
      if (!data) {
        return { error: 'Unable to fetch weather alerts at this time' };
      }
      return data;
    },
  }),

  getWeatherForecast: tool({
    description: 'Get the weather forecast for Sioux City for the next several days.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/weather/forecast');
      if (!data) {
        return { error: 'Unable to fetch weather forecast at this time' };
      }
      return data;
    },
  }),

  getRiverLevels: tool({
    description: 'Get current river gauge readings and flood stages for the Missouri River, Big Sioux River, and Floyd River near Sioux City.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/rivers');
      if (!data) {
        return { error: 'Unable to fetch river data at this time' };
      }
      return data;
    },
  }),

  getAirQuality: tool({
    description: 'Get current air quality index (AQI) and pollutant levels for Sioux City.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/air-quality');
      if (!data) {
        return { error: 'Unable to fetch air quality data at this time' };
      }
      return data;
    },
  }),

  getTrafficEvents: tool({
    description: 'Get active traffic incidents, road closures, and construction on major roads including I-29, I-129, US-20, and US-75 in the Sioux City area.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/traffic-events');
      if (!data) {
        return { error: 'Unable to fetch traffic data at this time' };
      }
      return data;
    },
  }),

  getNews: tool({
    description: 'Get local news headlines from Sioux City area news sources. NOT for sports schedules, scores, or team info - use perplexity_search for those.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/news');
      if (!data) {
        return { error: 'Unable to fetch news at this time' };
      }
      return data;
    },
  }),

  searchLocalNews: tool({
    description: 'Search recent Siouxland news for a specific local topic, policy, project, or controversy. Use this for questions like "what is going on with the library", "what happened with the budget", or "what has been reported about council plans".',
    inputSchema: z.object({
      query: z.string().describe('The local topic to search for in recent news coverage'),
    }),
    execute: async ({ query }) => {
      const data = await fetchApi<{ data?: NewsItem[] }>('/api/news');
      const newsItems = data?.data ?? [];
      const terms = extractSearchTerms(query);
      const normalizedQuery = normalizeSearchText(query);

      const matches = newsItems
        .map(item => ({
          ...item,
          score: scoreNewsItem(item, terms, normalizedQuery),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, 5);

      if (matches.length === 0) {
        return { message: 'No recent local news matches found for this topic.' };
      }

      return {
        results: matches.map(item => ({
          title: item.title,
          source: item.source,
          publishedAt: item.pubDate,
          link: item.link,
          summary: item.description || '',
        })),
      };
    },
  }),

  getGasPrices: tool({
    description: 'Get current gas prices at stations in the Sioux City area.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/gas-prices');
      if (!data) {
        return { error: 'Unable to fetch gas prices at this time' };
      }
      return data;
    },
  }),

  getFlights: tool({
    description: 'Get arrival and departure information for Sioux Gateway Airport (SUX).',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/flights');
      if (!data) {
        return { error: 'Unable to fetch flight data at this time' };
      }
      return data;
    },
  }),

  getAviationWeather: tool({
    description: 'Get aviation weather data (METAR observations and TAF forecasts) for Sioux Gateway Airport.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/aviation');
      if (!data) {
        return { error: 'Unable to fetch aviation weather at this time' };
      }
      return data;
    },
  }),

  getTransit: tool({
    description: 'Get real-time Sioux City Transit bus positions and route information.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/transit');
      if (!data) {
        return { error: 'Unable to fetch transit data at this time' };
      }
      return data;
    },
  }),

  getOutages: tool({
    description: 'Get current power outage information for the Sioux City area from MidAmerican Energy.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/outages');
      if (!data) {
        return { error: 'Unable to fetch outage data at this time' };
      }
      return data;
    },
  }),

  getEarthquakes: tool({
    description: 'Get recent earthquake activity in the region from USGS.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/earthquakes');
      if (!data) {
        return { error: 'Unable to fetch earthquake data at this time' };
      }
      return data;
    },
  }),

  getSystemStatus: tool({
    description: 'Get the health status of all data sources and services powering the dashboard.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/status');
      if (!data) {
        return { error: 'Unable to fetch system status at this time' };
      }
      return data;
    },
  }),

  getEvents: tool({
    description: 'Get upcoming community events in Sioux City from Explore Siouxland and Hard Rock Casino. Use for festivals, concerts, shows, or "what\'s happening" questions. NOT for sports schedules (Musketeers, Explorers) - use perplexity_search for those.',
    inputSchema: z.object({}),
    execute: async () => {
      const data = await fetchApi('/api/events');
      if (!data) {
        return { error: 'Unable to fetch community events at this time' };
      }
      return data;
    },
  }),

  searchKnowledgeBase: tool({
    description: 'Search the local knowledge base for Sioux City information not available in real-time data sources. Use this for questions about local history, culture, landmarks, restaurants, local tips, and general city information that wouldn\'t be in weather/traffic/news feeds.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant knowledge base entries'),
    }),
    execute: async ({ query }) => {
      const data = await fetchApi<{ results: Array<{ title: string; content: string; similarity: number }> }>(
        '/api/rag/search',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5, minSimilarity: 0.35 }),
        }
      );
      if (!data || !data.results || data.results.length === 0) {
        return { message: 'No relevant information found in the knowledge base for this query.' };
      }
      return {
        results: data.results.map(r => ({
          title: r.title,
          content: r.content,
          relevance: `${Math.round(r.similarity * 100)}%`,
        })),
      };
    },
  }),

  getCouncilRecaps: tool({
    description: 'Get the most recent Sioux City Council meeting recaps. Use this when users ask about sharing, finding, or linking to council recaps — it returns the latest meeting(s) with their shareable URLs. Also useful to check what recent meetings are available.',
    inputSchema: z.object({
      count: z.number().optional().describe('How many recent meetings to return (default 1, max 5)'),
    }),
    execute: async ({ count }) => {
      const limit = Math.min(Math.max(count ?? 1, 1), 5);
      type RecapMeeting = {
        title: string;
        meetingDate: string | null;
        videoUrl: string | null;
        recap: { summary: string; topics: string[]; decisions: string[] } | null;
      };
      const data = await fetchApi<{ meetings: RecapMeeting[] }>(`/api/council-meetings/recaps?all=${limit > 1}`);
      const meetings = (data?.meetings ?? []).slice(0, limit);
      if (meetings.length === 0) {
        return { message: 'No council meeting recaps available yet.' };
      }
      return {
        meetings: meetings.map((m) => ({
          title: m.title,
          meetingDate: m.meetingDate,
          recapUrl: m.meetingDate ? `https://siouxland.online/council/${m.meetingDate}` : null,
          videoUrl: m.videoUrl,
          summary: m.recap?.summary?.slice(0, 200) ?? null,
          topics: m.recap?.topics ?? [],
        })),
        allMeetingsUrl: 'https://siouxland.online/council',
      };
    },
  }),

  searchCouncilMeetings: tool({
    description: 'Search Sioux City Council meeting transcripts for discussions, decisions, votes, ordinances, public hearings, budget items, and project debates. Returns relevant excerpts with YouTube timestamp links to the exact moment in the meeting video. For topic questions, pass a descriptive query like "library budget cuts city council" instead of a single noun.',
    inputSchema: z.object({
      query: z.string().describe('The search query about council meeting content'),
      dateFrom: z.string().optional().describe('Optional start date filter (YYYY-MM-DD)'),
      dateTo: z.string().optional().describe('Optional end date filter (YYYY-MM-DD)'),
    }),
    execute: async ({ query, dateFrom, dateTo }) => {
      const queryVariants = buildCouncilSearchQueries(query);
      const searches = await Promise.all(
        queryVariants.map((candidateQuery) =>
          fetchApi<{ results: CouncilSearchResult[] }>(
            '/api/council-meetings/search',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: candidateQuery, dateFrom, dateTo, limit: 5 }),
            }
          )
        )
      );

      const results = mergeCouncilResults(
        searches
          .map(result => result?.results ?? [])
          .filter(result => result.length > 0)
      );

      if (results.length === 0) {
        return { message: 'No relevant council meeting discussions found for this query.' };
      }

      return {
        results: results.map(r => ({
          meetingTitle: r.meetingTitle,
          meetingDate: r.meetingDate,
          excerpt: r.content,
          youtubeLink: r.youtubeLink,
          recapUrl: r.meetingDate ? `https://siouxland.online/council/${r.meetingDate}` : null,
          relevance: `${Math.round(r.similarity * 100)}%`,
        })),
      };
    },
  }),

  // ──────────────────────────────────────────────
  // Local Eats (Yelp)
  // ──────────────────────────────────────────────

  searchLocalEats: tool({
    description: 'Search Sioux City restaurants on Yelp by cuisine, name, price, or vibe. Use for "where should I eat", "best Mexican food", "cheap lunch spots", "nice date night restaurant", or any food/dining question. Returns ratings, prices, addresses, and phone numbers. Prefer this over the knowledge base for restaurant questions — it has live Yelp data.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search term like "pizza", "sushi", "brunch", or a restaurant name'),
      category: z.string().optional().describe('Yelp category alias like "mexican", "pizza", "chinese", "bbq", "burgers", "seafood", "italian", "thai", "vietnamese", "indian", "breakfast_brunch", "coffee"'),
      price: z.string().optional().describe('Price filter: "1" ($), "2" ($$), "3" ($$$), "4" ($$$$). Comma-separated for multiple: "1,2"'),
      sortBy: z.enum(['best_match', 'rating', 'review_count', 'distance']).optional().describe('Sort order (default: best_match)'),
    }),
    execute: async ({ query, category, price, sortBy }) => {
      try {
        const { fetchLocalEats } = await import('@/lib/fetchers/yelp');
        const data = await fetchLocalEats({
          term: query,
          category,
          price,
          sortBy,
          limit: 10,
        });

        if (data.restaurants.length === 0) {
          return { message: 'No restaurants found matching that criteria in the Sioux City area.' };
        }

        return {
          restaurants: data.restaurants.map(r => ({
            name: r.name,
            rating: r.rating,
            reviewCount: r.reviewCount,
            price: r.price || 'N/A',
            categories: r.categories.map(c => c.title).join(', '),
            phone: r.displayPhone,
            address: r.location.displayAddress.join(', '),
            yelpUrl: r.yelpUrl,
            id: r.id,
          })),
          total: data.total,
          source: 'yelp',
        };
      } catch (error) {
        return { error: 'Unable to search restaurants at this time' };
      }
    },
  }),

  getRestaurantDetails: tool({
    description: 'Get detailed info about a specific Sioux City restaurant including hours of operation, whether it\'s open right now, photos, and top reviews. Use after searchLocalEats when a user wants more info about a specific place, or when they ask "is X open", "what are the hours", or "what do people say about X".',
    inputSchema: z.object({
      businessId: z.string().describe('Yelp business ID from searchLocalEats results'),
      includeReviews: z.boolean().optional().describe('Also fetch top 3 review excerpts (default: true)'),
    }),
    execute: async ({ businessId, includeReviews = true }) => {
      try {
        const { fetchRestaurantDetails, fetchRestaurantReviews } = await import('@/lib/fetchers/yelp');

        const [details, reviews] = await Promise.all([
          fetchRestaurantDetails(businessId),
          includeReviews
            ? fetchRestaurantReviews(businessId).catch(() => [])
            : Promise.resolve([]),
        ]);

        return {
          name: details.name,
          rating: details.rating,
          reviewCount: details.reviewCount,
          price: details.price || 'N/A',
          categories: details.categories.map(c => c.title).join(', '),
          phone: details.displayPhone,
          address: details.location.displayAddress.join(', '),
          yelpUrl: details.yelpUrl,
          isOpenNow: details.isOpenNow,
          hours: details.hours,
          photos: details.photos.slice(0, 3),
          reviews: reviews.map(r => ({
            text: r.text,
            rating: r.rating,
            user: r.userName,
          })),
          source: 'yelp',
        };
      } catch (error) {
        return { error: 'Unable to fetch restaurant details at this time' };
      }
    },
  }),

  findDelivery: tool({
    description: 'Find restaurants that offer food delivery in the Sioux City area. Use when someone asks "what delivers", "food delivery near me", or "order food".',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { fetchDeliveryRestaurants } = await import('@/lib/fetchers/yelp');
        const data = await fetchDeliveryRestaurants();

        if (data.restaurants.length === 0) {
          return { message: 'No delivery restaurants found in the area.' };
        }

        return {
          restaurants: data.restaurants.slice(0, 10).map(r => ({
            name: r.name,
            rating: r.rating,
            categories: r.categories.map(c => c.title).join(', '),
            phone: r.displayPhone,
            address: r.location.displayAddress.join(', '),
            yelpUrl: r.yelpUrl,
          })),
          total: data.total,
          source: 'yelp',
          note: 'Delivery availability from Yelp — check restaurant directly to confirm.',
        };
      } catch (error) {
        return { error: 'Unable to search delivery restaurants at this time' };
      }
    },
  }),

  // Web search via Firecrawl
  webSearch: tool({
    description: 'Search the web for realtime Siouxland information. USE IMMEDIATELY (no clarifying questions) for: Sioux City Musketeers schedules/scores, Sioux City Explorers, local sports, specific event dates, business info. "Sioux City hockey" means Musketeers - just search, don\'t ask. When searching for schedules or upcoming events, include the current year/season context.',
    inputSchema: z.object({
      query: z.string().describe('The search query - be specific, include "Sioux City" or team names. For schedules, include the year (e.g., "2026" or "January 2026")'),
    }),
    execute: async ({ query }) => {
      // Add current date context to help with time-sensitive queries
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'long' });
      const currentYear = now.getFullYear();
      console.log(`[Web Search] Query: "${query}" (Current: ${currentMonth} ${currentYear})`);
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        return { error: 'Web search is not configured' };
      }

      try {
        const firecrawl = new Firecrawl({ apiKey });
        const data = await firecrawl.search(query, {
          limit: 3,
          location: 'Iowa, United States',
          tbs: 'qdr:y', // Prioritize results from the past year
          // Scrape the actual page content so agent gets real data, not just links
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        });

        // SDK returns SearchData directly with web/news/images arrays
        // When scrapeOptions is used, results include markdown content
        const webResults = data.web || [];
        if (webResults.length === 0) {
          return { error: 'Search returned no results' };
        }

        // Return results with actual content for the agent to use
        return {
          results: webResults.map((r) => {
            const result = r as {
              title?: string;
              url?: string;
              description?: string;
              markdown?: string;
              metadata?: { title?: string; url?: string; description?: string };
            };
            return {
              title: result.title || result.metadata?.title || '',
              url: result.url || result.metadata?.url || '',
              snippet: result.description || result.metadata?.description || '',
              // Include scraped content so agent can extract actual info
              content: result.markdown || '',
            };
          }),
        };
      } catch (error) {
        console.error('[Web Search] Error:', error);
        return { error: 'Failed to search the web' };
      }
    },
  }),
};
