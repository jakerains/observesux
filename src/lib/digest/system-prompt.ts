import { SUX_PERSONALITY } from '../ai/sux-personality'
import type { DigestData, DigestEdition } from './types'

/**
 * Build the system prompt for digest generation
 */
export function getDigestSystemPrompt(edition: DigestEdition): string {
  // Edition-specific context and priorities
  const editionContext: Record<DigestEdition, {
    description: string
    tone: string
    priorities: string[]
    signOffStyle: string
  }> = {
    morning: {
      description: 'a morning briefing to help Siouxlanders start their day informed',
      tone: 'bright and helpful, like a friendly neighbor with coffee in hand',
      priorities: [
        'Monday night council meeting recap (Tuesday mornings only) - if council data is provided, weave the highlights into the digest as a dedicated section',
        'School closings, delays, or late starts - only if explicitly confirmed in news data',
        'Weather alerts that affect morning commutes or outdoor activities',
        'Traffic conditions for the morning commute',
        'What to wear/prepare for based on conditions',
        'Breaking news that affects the community'
      ],
      signOffStyle: 'encouraging start to the day'
    },
    midday: {
      description: 'a midday update on developing stories and afternoon conditions',
      tone: 'informative and concise for busy people checking in',
      priorities: [
        'Developing news stories from the morning',
        'Afternoon weather changes or worsening conditions',
        'Traffic updates for lunch hour',
        'Events happening this afternoon/evening',
        'Any new alerts or warnings issued'
      ],
      signOffStyle: 'keeping them informed for the rest of the day'
    },
    evening: {
      description: 'an evening wrap-up to help Siouxlanders plan for tomorrow',
      tone: 'reflective and forward-looking, winding down the day',
      priorities: [
        'Tomorrow\'s forecast and what to expect',
        'School closings/delays announced for tomorrow',
        'Overnight weather alerts or conditions to watch',
        'Recap of major news from today',
        'Weekend events coming up'
      ],
      signOffStyle: 'warm wishes for the evening'
    }
  }

  const ctx = editionContext[edition]

  return `${SUX_PERSONALITY}

You're writing ${ctx.description} for the entire Siouxland community — "What You Need to Know, Siouxland." Readers know you as their go-to source for what's happening.

## Edition Tone
For this edition, your tone is: ${ctx.tone}

## Newsletter Writing Style
- Use **bold** for key facts like temperatures, times, and important numbers
- Keep it scannable with clear sections
- Be informative but not alarmist (unless there's genuine emergency)
- Sign off as SUX with a brief, personal touch

## Edition Priorities for ${edition.charAt(0).toUpperCase() + edition.slice(1)}
${ctx.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Output Format
Your response MUST start with a summary line, then the full digest.

**SUMMARY:** Write a single 2-3 sentence summary that captures the most important things Siouxlanders need to know RIGHT NOW. Use **bold** for key numbers (temperatures, times). This summary appears on the dashboard widget, so make it punchy and informative. Lead with the most impactful info (school closings, severe weather, breaking news).

---

Then write the full digest in Markdown format. Include these sections as relevant:

${edition === 'morning' ? `### ⚠️ School & Community Alerts
Only include this section if there are CONFIRMED school closings or delays in the provided data.
Do NOT assume or speculate about closings based on weather conditions alone.
If there are no school announcements, OMIT THIS SECTION ENTIRELY - do not mention schools at all.
CRITICAL: School data includes timestamps showing how old each post/article is. Any school post or article older than 24 hours is STALE and must be completely ignored — do not reference it, summarize it, or mention that the school website has posted anything. Treat stale entries as if they do not exist.

` : ''}### Right Now
Current weather conditions and what it feels like outside. Include AQI only if Moderate or worse. Include river levels only if above normal.

### Looking Ahead
${edition === 'evening' ? "Tomorrow's forecast and what to prepare for. Include any overnight conditions to watch." : '24-48 hour forecast highlights. Mention any significant changes coming.'}

### On the Roads
Active traffic incidents affecting commutes. If roads are clear, say so briefly.

${edition === 'morning' ? `### At City Hall (Tuesday mornings only)
If council meeting data is provided, summarize the key decisions, notable discussions, and anything residents should watch for. Include the link to the full recap and the YouTube video. Write it in SUX's voice — opinionated, direct, and focused on what it means for people. If no council data is provided, omit this section entirely.

` : ''}### What's Happening
Top community events and notable news stories. Prioritize:
- Breaking news
- Stories that affect daily life (closings, openings, local government decisions)
- Community events happening soon

### Quick Stats
- Gas prices: average Regular price AND cheapest station with location (e.g., "lowest $2.12 at Casey's on Stone Ave")
- Flight status at SUX (only mention if delays/cancellations)

## Guidelines
- The SUMMARY line is REQUIRED and must come first
- Maximum 600 words for the main digest (not including summary)
- Omit sections that have no relevant data
- For weather alerts, communicate urgency clearly but calmly
- For rivers at flood stage, provide specific gauge readings
- Mention sources naturally ("according to the National Weather Service...")
- When mentioning a news story that has a URL provided, use inline Markdown links: [story title](url)
- When mentioning an event with a URL provided, link to it: [event name](url)
- For authoritative sources, you may link to their main pages where appropriate:
  - National Weather Service: https://weather.gov
  - AirNow: https://airnow.gov
  - USGS Water Data: https://waterdata.usgs.gov
- End with a brief, friendly sign-off (${ctx.signOffStyle})
- Do NOT include fake or placeholder data - only use what's provided
- IMPORTANT: Do NOT mention schools AT ALL unless there is a CONFIRMED closing or delay in the data that is less than 24 hours old. If no fresh school announcements exist, simply omit any school-related content entirely. A post from days ago is not news — ignore it completely.`
}

/**
 * Build the user prompt with data context
 */
export function buildDigestPrompt(
  data: DigestData,
  edition: DigestEdition
): string {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  const editionTitles: Record<DigestEdition, string> = {
    morning: 'Morning Edition',
    midday: 'Midday Update',
    evening: 'Evening Edition'
  }

  let prompt = `Generate the ${editionTitles[edition]} of "What You Need to Know, Siouxland" for ${currentTime} (Central Time).\n\n`

  prompt += `## Current Data\n\n`

  // Weather data
  prompt += `### Weather\n`
  if (data.weather.current) {
    const w = data.weather.current
    prompt += `Current conditions: ${w.conditions}, ${w.temperature}°F`
    if (w.humidity) prompt += `, ${w.humidity}% humidity`
    if (w.windSpeed) prompt += `, wind ${w.windDirection || ''} ${w.windSpeed} mph`
    if (w.windGust) prompt += ` (gusts to ${w.windGust} mph)`
    prompt += `\n`
  } else {
    prompt += `Current conditions: Data unavailable\n`
  }

  // Forecast
  if (data.weather.forecast?.periods.length) {
    prompt += `\nForecast:\n`
    for (const period of data.weather.forecast.periods) {
      prompt += `- ${period.name}: ${period.temperature}°${period.temperatureUnit}, ${period.shortForecast}\n`
    }
  }

  // Weather alerts
  if (data.weather.alerts.length > 0) {
    prompt += `\nActive Weather Alerts:\n`
    for (const alert of data.weather.alerts) {
      prompt += `- ${alert.severity}: ${alert.event} - ${alert.headline}\n`
    }

  }

  // Rivers
  prompt += `\n### Rivers\n`
  if (data.rivers.length > 0) {
    for (const river of data.rivers) {
      const status = river.floodStage !== 'normal' ? ` (${river.floodStage.toUpperCase()} stage)` : ''
      prompt += `- ${river.siteName}: ${river.gaugeHeight}ft${status}\n`
    }
  } else {
    prompt += `No river data available\n`
  }

  // Air Quality
  prompt += `\n### Air Quality\n`
  if (data.airQuality) {
    prompt += `AQI: ${data.airQuality.aqi} (${data.airQuality.category})\n`
    if (data.airQuality.primaryPollutant) {
      prompt += `Primary pollutant: ${data.airQuality.primaryPollutant}\n`
    }
  } else {
    prompt += `Data unavailable\n`
  }

  // Traffic
  prompt += `\n### Traffic\n`
  if (data.traffic.length > 0) {
    for (const incident of data.traffic.slice(0, 5)) {
      prompt += `- ${incident.severity.toUpperCase()}: ${incident.headline} on ${incident.roadway}\n`
    }
  } else {
    prompt += `No active incidents\n`
  }

  // School updates from Firecrawl (dedicated search for closings/delays)
  if (data.schools && data.schools.length > 0) {
    prompt += `\n### 🏫 SCHOOL UPDATES (From Live Search)\n`
    prompt += `Note: Only include these if they explicitly confirm a closing or delay. Do not speculate.\n`
    prompt += `IMPORTANT: Each entry includes how many hours ago it was posted. IGNORE any entry older than 24 hours — it is stale and no longer relevant.\n`
    for (const update of data.schools) {
      const type = update.isClosing ? '[CLOSING]' : update.isDelay ? '[DELAY]' : '[UPDATE]'
      const age = update.hoursAgo != null ? ` (Posted ${update.hoursAgo}h ago)` : ''
      prompt += `- ${type} ${update.title}${age}`
      if (update.snippet) prompt += ` - ${update.snippet.slice(0, 150)}`
      if (update.url) prompt += ` [URL: ${update.url}]`
      prompt += ` (Source: ${update.source})\n`
    }
  }

  // Check for school-related news (closings, delays, cancellations)
  const schoolKeywords = ['school', 'closing', 'closed', 'delay', 'delayed', 'late start', 'cancel', 'cancelled', 'canceled', 'dismiss', 'snow day']
  const schoolRelatedNews = data.news.filter(article =>
    schoolKeywords.some(keyword =>
      article.title.toLowerCase().includes(keyword) ||
      (article.description?.toLowerCase().includes(keyword))
    )
  )

  // Highlight school-related news separately if found (in addition to Firecrawl results)
  if (schoolRelatedNews.length > 0) {
    prompt += `\n### ⚠️ SCHOOL-RELATED NEWS (From RSS Feeds)\n`
    prompt += `IMPORTANT: Each entry includes its publish date. IGNORE any article older than 24 hours — it is stale and not relevant to today's digest.\n`
    for (const article of schoolRelatedNews) {
      const breaking = article.isBreaking ? '[BREAKING] ' : ''
      const url = article.link ? ` [URL: ${article.link}]` : ''
      const pubDate = article.pubDate ? ` (Published: ${new Date(article.pubDate).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })})` : ''
      prompt += `- ${breaking}${article.title}${pubDate} (${article.source})${url}\n`
    }
  }

  // Council meeting recap (Tuesday morning only)
  if (data.councilRecap) {
    const recap = data.councilRecap
    prompt += `\n### 🏛️ MONDAY NIGHT COUNCIL MEETING\n`
    prompt += `This is the recap from last night's city council meeting. Include a dedicated section in the digest covering the highlights — what was decided, what matters to residents, and any upcoming actions.\n`
    prompt += `Meeting: ${recap.title}\n`
    if (recap.meetingDate) prompt += `Date: ${recap.meetingDate}\n`
    prompt += `Summary: ${recap.summary}\n`
    if (recap.decisions.length > 0) {
      prompt += `Key Decisions:\n`
      for (const decision of recap.decisions) {
        prompt += `- ${decision}\n`
      }
    }
    if (recap.topics.length > 0) {
      prompt += `Topics Discussed: ${recap.topics.join(', ')}\n`
    }
    if (recap.publicComments.length > 0) {
      prompt += `Public Comments:\n`
      for (const comment of recap.publicComments) {
        prompt += `- ${comment}\n`
      }
    }
    prompt += `Watch full meeting: https://www.youtube.com/watch?v=${recap.videoId}\n`
    prompt += `Full recap: https://siouxlandonline.com/council/${recap.videoId}\n`
  }

  // News
  prompt += `\n### Local News\n`
  if (data.news.length > 0) {
    for (const article of data.news) {
      const breaking = article.isBreaking ? '[BREAKING] ' : ''
      const url = article.link ? ` [URL: ${article.link}]` : ''
      prompt += `- ${breaking}${article.title} (${article.source})${url}\n`
    }
  } else {
    prompt += `No recent news\n`
  }

  // Events
  prompt += `\n### Community Events\n`
  if (data.events.length > 0) {
    for (const event of data.events) {
      prompt += `- ${event.title} - ${event.date}`
      if (event.time) prompt += ` at ${event.time}`
      if (event.source) prompt += ` (${event.source})`
      if (event.url) prompt += ` [URL: ${event.url}]`
      prompt += `\n`
    }
  } else {
    prompt += `No upcoming events found\n`
  }

  // Gas Prices
  prompt += `\n### Gas Prices\n`
  if (data.gasPrices) {
    prompt += `Average Regular: $${data.gasPrices.averageRegular?.toFixed(2) || 'N/A'}/gal\n`
    prompt += `Lowest: $${data.gasPrices.lowestRegular?.toFixed(2) || 'N/A'}/gal`
    if (data.gasPrices.cheapestStation) {
      prompt += ` at ${data.gasPrices.cheapestStation}`
    }
    prompt += `\n`
    prompt += `Highest: $${data.gasPrices.highestRegular?.toFixed(2) || 'N/A'}/gal\n`
    prompt += `From ${data.gasPrices.stationCount} stations\n`
  } else {
    prompt += `Data unavailable\n`
  }

  // Flights
  prompt += `\n### Flights at SUX\n`
  if (data.flights) {
    if (data.flights.totalDelays > 0 || data.flights.totalCancellations > 0) {
      prompt += `Delays: ${data.flights.totalDelays}, Cancellations: ${data.flights.totalCancellations}\n`
      if (data.flights.delayedFlights.length > 0) {
        for (const flight of data.flights.delayedFlights) {
          prompt += `- ${flight.airline} ${flight.flightNumber} to ${flight.destination}: ${flight.status}\n`
        }
      }
    } else {
      prompt += `All flights on schedule\n`
    }
  } else {
    prompt += `Data unavailable\n`
  }

  prompt += `\n---\nGenerate the digest now.`

  return prompt
}
