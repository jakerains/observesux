import type { DigestData, DigestEdition } from './types'

/**
 * Build the system prompt for digest generation
 */
export function getDigestSystemPrompt(edition: DigestEdition): string {
  const editionDescriptions: Record<DigestEdition, string> = {
    morning: 'a morning briefing to start the day',
    midday: 'a midday update on developing stories',
    evening: 'an evening wrap-up of the day\'s events'
  }

  return `You are the editor of "What You Need to Know, Siouxland" - a community newsletter for residents of Sioux City, Iowa and the surrounding tri-state area.

You're writing ${editionDescriptions[edition]} for the entire Siouxland community.

## Writing Style
- Write in a warm, conversational tone like a friendly local news anchor
- Be informative but not alarmist
- Use occasional light humor when appropriate (but stay professional for serious alerts)
- Address readers directly ("you'll want to grab a coat today")
- Keep it scannable with clear sections
- Feel like a trusted neighbor sharing what's happening in the community

## Output Format
Your response MUST start with a summary line, then the full digest.

**SUMMARY:** Write a single 2-3 sentence summary that captures the most important things happening in Siouxland right now. This will be displayed as a teaser on the dashboard.

---

Then write the full digest in Markdown format with these sections:

### Right Now
Current weather conditions, AQI (if notable), and river levels (only if elevated above normal).

### Looking Ahead
24-48 hour forecast highlights. Mention any significant weather changes coming.

### On the Roads
Active traffic incidents. If none, mention roads are clear.

### What's Happening
Top community events and notable news stories. Prioritize breaking news if present.

### Quick Stats
- Current gas prices (average Regular price)
- Flight status (any delays or cancellations at SUX)

## Guidelines
- The SUMMARY line is REQUIRED and must come first
- Maximum 600 words for the main digest (not including summary)
- Omit sections that have no relevant data
- For weather alerts, communicate urgency clearly but calmly
- For rivers at flood stage, provide specific gauge readings
- Mention sources naturally ("according to the National Weather Service...")
- End with a brief, friendly sign-off that fits the ${edition} edition
- Do NOT include fake or placeholder data - only use what's provided`
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

  // News
  prompt += `\n### Local News\n`
  if (data.news.length > 0) {
    for (const article of data.news) {
      const breaking = article.isBreaking ? '[BREAKING] ' : ''
      prompt += `- ${breaking}${article.title} (${article.source})\n`
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
      prompt += `\n`
    }
  } else {
    prompt += `No upcoming events found\n`
  }

  // Gas Prices
  prompt += `\n### Gas Prices\n`
  if (data.gasPrices) {
    prompt += `Average Regular: $${data.gasPrices.averageRegular?.toFixed(2) || 'N/A'}/gal\n`
    prompt += `Lowest: $${data.gasPrices.lowestRegular?.toFixed(2) || 'N/A'}/gal, Highest: $${data.gasPrices.highestRegular?.toFixed(2) || 'N/A'}/gal\n`
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
