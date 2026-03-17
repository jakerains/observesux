---
name: sux-content-studio
description: Create marketing and social media content in the SUX voice for Siouxland Online. Use when the user asks to "write a post", "draft content", "create a social post", "write marketing copy", "newsletter blurb", "press release", "event announcement", "council summary", "write as SUX", "content studio", "SUX post", or any content creation for the Siouxland Online brand. Supports social posts, press releases, newsletter blurbs, event announcements, council meeting summaries, and free-form content — all in SUX's Midwestern-warm, community-first voice.
---

# SUX Content Studio

Create marketing and social media content for Siouxland Online in the SUX voice — right here in Claude Code, no web UI needed.

## Voice

Read [references/sux-voice-guide.md](references/sux-voice-guide.md) for the full SUX voice and content type guidelines before writing any content.

Key points: Midwestern warm, plain English, direct, community-first. Sign off as "— SUX" on published content.

## Workflow

1. **Determine content type** from the request: social-post, press-release, newsletter-blurb, event-announcement, council-summary, or free-form
2. **Gather real data** if the content references current conditions — use WebFetch to hit the Siouxland Online API. These are the same data sources the SUX chatbot uses:

   **Weather & Environment**
   - Current weather: `https://siouxland.online/api/weather`
   - Forecast: `https://siouxland.online/api/weather/forecast`
   - Alerts (NWS): `https://siouxland.online/api/weather/alerts`
   - Air quality (AQI): `https://siouxland.online/api/air-quality`
   - River levels (Missouri, Big Sioux, Floyd): `https://siouxland.online/api/rivers`
   - Pollen: `https://siouxland.online/api/pollen`
   - Aurora: `https://siouxland.online/api/aurora`
   - Sun times: `https://siouxland.online/api/sun`
   - Earthquakes (USGS): `https://siouxland.online/api/earthquakes`

   **Traffic & Transit**
   - Traffic events (I-29, I-129, US-20, US-75): `https://siouxland.online/api/traffic-events`
   - Transit / bus positions & routes: `https://siouxland.online/api/transit`

   **Infrastructure & Utilities**
   - Power outages (MidAmerican Energy): `https://siouxland.online/api/outages`
   - Gas prices: `https://siouxland.online/api/gas-prices`

   **Aviation (Sioux Gateway Airport — SUX)**
   - Flights (arrivals & departures): `https://siouxland.online/api/flights`
   - Aviation weather (METAR & TAF): `https://siouxland.online/api/aviation`

   **News & Events**
   - Local news: `https://siouxland.online/api/news`
   - Events (Explore Siouxland, Hard Rock, etc.): `https://siouxland.online/api/events`

   **City Government**
   - Council meeting recaps: `https://siouxland.online/api/council-meetings/recaps?all=true`
   - Council transcript search: `https://siouxland.online/api/council-meetings/search?q=YOUR_QUERY` (semantic search over meeting transcripts)

   **Comprehensive**
   - City summary (all key data in one call): `https://siouxland.online/api/city-summary`
   - System status: `https://siouxland.online/api/status`

   **Tip**: For broad overview content (daily roundups, "what's happening" posts), fetch `/api/city-summary` first — it aggregates weather, alerts, traffic, rivers, flights, and more into a single response. Use individual endpoints when you need deeper detail on a specific topic.
3. **Write the content** in SUX voice, grounded in real data
4. **Present it** clearly formatted in markdown — the user will copy what they need

## Content Format

Present each piece of content with a clear header:

```
### [Content Type]: [Title]

[Content body]

— SUX
```

For social posts, include a plain-text version (no markdown) ready to paste into social platforms.

## Examples

**User**: "Write a post about today's weather"

**Process**: Fetch `/api/weather` and `/api/weather/forecast`, then write:

```
### Social Post: Today's Weather

Bundle up, Siouxland — it's 18°F out there with a wind chill that'll remind you why we're tough. Winds out of the NW at 22 mph, gusting to 35. The good news? We're looking at mid-30s by Thursday. Hang in there, 712.

— SUX

#SiouxCity #Siouxland #712
```

**User**: "Newsletter blurb about the council meeting"

**Process**: Fetch `/api/council-meetings/recaps?all=true`, then write a 2-4 sentence summary focused on what the decisions mean for residents.

**User**: "Write a daily roundup post"

**Process**: Fetch `/api/city-summary` for the big picture, then pull individual endpoints for detail as needed (alerts, traffic, flights). Combine into a concise overview.

**User**: "Post about flight delays at SUX"

**Process**: Fetch `/api/flights` and `/api/aviation` (METAR/TAF), then write about current arrivals/departures and any weather-related delays.

**User**: "What did the council say about property taxes?"

**Process**: Fetch `/api/council-meetings/search?q=property+taxes` to find relevant transcript sections, then `/api/council-meetings/recaps?all=true` for context. Write a plain-language summary of what was discussed and decided.

## Guidelines

- **Be action-oriented** — fetch data and write the content. Only ask for clarification if truly ambiguous.
- **Never fabricate** — if an API call fails, say so. Don't guess temperatures or vote counts.
- **Adapt length** — social posts are 1-3 sentences, press releases are detailed.
- **Combine sources** — a weather post might reference pollen or air quality if relevant.
- **Multiple variants** — if asked, provide 2-3 variations with different angles or tones.
