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
        'CRITICAL: School closings, delays, or late starts - always highlight these first if weather conditions could affect schools',
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

  return `You are the editor of "What You Need to Know, Siouxland" - a community newsletter for residents of Sioux City, Iowa and the surrounding tri-state area (Iowa, Nebraska, South Dakota).

You're writing ${ctx.description} for the entire Siouxland community.

## Writing Style
- Write in a warm, conversational tone - ${ctx.tone}
- Be informative but not alarmist (unless there's genuine emergency)
- Use occasional light humor when appropriate (but stay professional for serious alerts)
- Address readers directly ("you'll want to bundle up today", "grab that umbrella")
- Keep it scannable with clear sections
- Feel like a trusted neighbor sharing what's happening in the community
- Use **bold** for key facts like temperatures, times, and important numbers

## Edition Priorities for ${edition.charAt(0).toUpperCase() + edition.slice(1)}
${ctx.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Output Format
Your response MUST start with a summary line, then the full digest.

**SUMMARY:** Write a single 2-3 sentence summary that captures the most important things Siouxlanders need to know RIGHT NOW. Use **bold** for key numbers (temperatures, times). This summary appears on the dashboard widget, so make it punchy and informative. Lead with the most impactful info (school closings, severe weather, breaking news).

---

Then write the full digest in Markdown format. Include these sections as relevant:

${edition === 'morning' ? `### ⚠️ School & Community Alerts
ALWAYS include this section if:
- Weather conditions (extreme cold, snow, ice) could affect schools
- Any news mentions school closings, delays, or late starts
- There are weather advisories/warnings in effect
If no alerts, you may omit this section.

` : ''}### Right Now
Current weather conditions and what it feels like outside. Include AQI only if Moderate or worse. Include river levels only if above normal.

### Looking Ahead
${edition === 'evening' ? "Tomorrow's forecast and what to prepare for. Include any overnight conditions to watch." : '24-48 hour forecast highlights. Mention any significant changes coming.'}

### On the Roads
Active traffic incidents affecting commutes. If roads are clear, say so briefly.

### What's Happening
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
- IMPORTANT: If news items mention "school", "closing", "delay", "late start", "canceled", "cancelled" - ALWAYS highlight this prominently`
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

    // Check for weather conditions that typically cause school closings/delays
    const schoolImpactKeywords = ['blizzard', 'ice storm', 'winter storm', 'extreme cold', 'wind chill', 'freezing rain', 'heavy snow']
    const schoolImpactAlerts = data.weather.alerts.filter(alert =>
      schoolImpactKeywords.some(keyword =>
        alert.event.toLowerCase().includes(keyword) ||
        alert.headline.toLowerCase().includes(keyword)
      )
    )
    if (schoolImpactAlerts.length > 0) {
      prompt += `\n⚠️ NOTE: These weather conditions often lead to school closings/delays in the Siouxland area. Check with local school districts.\n`
    }
  }

  // Check for extreme cold that could affect schools (wind chill below -20 or temp below -10)
  if (data.weather.current) {
    const temp = data.weather.current.temperature
    const windChill = data.weather.current.windChill ?? null
    if ((temp !== null && temp <= -10) || (windChill !== null && windChill <= -20)) {
      prompt += `\n⚠️ EXTREME COLD: Current conditions (${temp}°F${windChill !== null ? `, feels like ${windChill}°F` : ''}) are severe enough that school closings/delays are common in the area.\n`
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
    prompt += `\n### 🏫 SCHOOL UPDATES (From Live Search - PRIORITIZE THESE!)\n`
    for (const update of data.schools) {
      const type = update.isClosing ? '[CLOSING]' : update.isDelay ? '[DELAY]' : '[UPDATE]'
      prompt += `- ${type} ${update.title}`
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
    for (const article of schoolRelatedNews) {
      const breaking = article.isBreaking ? '[BREAKING] ' : ''
      const url = article.link ? ` [URL: ${article.link}]` : ''
      prompt += `- ${breaking}${article.title} (${article.source})${url}\n`
    }
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
