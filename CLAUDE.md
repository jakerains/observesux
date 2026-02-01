# Claude Code Instructions for Siouxland Online

Project-specific instructions for Claude Code when working on this codebase.

## Project Overview

Siouxland Online is a real-time observability dashboard for Sioux City, Iowa. It aggregates data from multiple public APIs (weather, traffic, transit, etc.) into a responsive dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui
- **Data Fetching**: SWR with polling intervals
- **Database**: Neon Serverless PostgreSQL (siouxland-online-neon / shy-violet-53187602)
- **Auth**: Neon Auth (Better Auth)
- **Maps**: Leaflet + React-Leaflet
- **Notifications**: Web Push API

## Key Directories

- `/src/app/api/` - API routes that proxy external data sources
- `/src/app/api/user/` - User-specific API routes (alerts, watchlist, preferences)
- `/src/app/auth/` - Authentication pages (sign-in, sign-up)
- `/src/app/account/` - Account settings pages
- `/src/components/dashboard/` - Widget components
- `/src/components/alerts/` - Alert subscription components
- `/src/components/watchlist/` - Watchlist/favorites components
- `/src/lib/auth/` - Neon Auth client and server utilities
- `/src/lib/hooks/` - Custom hooks including `useDataFetching.ts`
- `/src/lib/contexts/` - React contexts for state management
- `/src/lib/db/` - Database operations
- `/src/types/` - TypeScript type definitions

---

## Changelog Management

When the user says "commit and push", always bump the version and update the changelog as part of that process before committing:
- **Patch bump** (Z) for most changes — bug fixes, small features, tweaks
- **Minor bump** (Y) for significant new features or large updates
- Then follow the changelog steps below.

When the user asks to "update the changelog" or "bump the version", follow these steps:

### 1. Check Current Version

```bash
grep '"version"' package.json
```

### 2. Check if Changelog Entry Exists

**IMPORTANT:** Before bumping the version, check if the current version in `package.json` already has an entry in `CHANGELOG.md`. If the version exists in `package.json` but is missing from the changelog, add the entry for that version - do NOT bump to a new version.

```bash
grep "## \[$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)\]" CHANGELOG.md
```

If no entry exists, add one for the current version. Only bump the version number if the current version already has a changelog entry.

### 3. Review Changes Since Last Version

Look at git history to identify changes:

```bash
git log --oneline -20
```

### 4. Update Files

Update these three files:

#### a) `package.json` - Bump version number

```json
"version": "X.Y.Z"
```

Use semantic versioning:
- **MAJOR (X)**: Breaking changes
- **MINOR (Y)**: New features, backward compatible
- **PATCH (Z)**: Bug fixes, small improvements

#### b) `CHANGELOG.md` - Add new version section at the top

Follow the [Keep a Changelog](https://keepachangelog.com) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes
```

#### c) `src/components/dashboard/ChangelogModal.tsx` - Add to CHANGELOG array

Add new entry at the **top** of the `CHANGELOG` array:

```typescript
const CHANGELOG = [
  {
    version: 'X.Y.Z',
    date: 'YYYY-MM-DD',
    added: [
      'Feature 1',
      'Feature 2',
    ],
    changed: [
      'Change 1',
    ],
    fixed: [
      'Fix 1',
    ],
  },
  // ... existing entries
]
```

### 5. Verify Build

```bash
vercel build
```

---

## Widget Development

### Adding a New Widget

1. Create component in `/src/components/dashboard/NewWidget.tsx`
2. Add data hook in `/src/lib/hooks/useDataFetching.ts`
3. Create API route in `/src/app/api/new-endpoint/route.ts`
4. Register in `WIDGET_COMPONENTS` map in `/src/app/page.tsx`
5. Add to `DEFAULT_WIDGETS` in `/src/lib/contexts/DashboardLayoutContext.tsx`
6. Add to status tracking in `/src/app/api/status/route.ts`

### Widget Patterns

- Use `DashboardCard` wrapper for consistent styling
- Include `RefreshAction` component for manual refresh
- Use `getDataFreshness()` for Live/Stale status
- Support expand/collapse with `useDashboardLayout().setWidgetSize()`

---

## Data Freshness

Widgets show "Live" or "Stale" status based on:

```typescript
const lastUpdated = apiResponse?.timestamp // Use API fetch time, NOT source observation time
const status = getDataFreshness({ lastUpdated, refreshInterval })
```

The threshold is `refreshInterval * 3` before showing "Stale".

---

## Common Tasks

### Adding a New Data Source

1. Create fetcher in `/src/lib/fetchers/`
2. Create API route in `/src/app/api/`
3. Add hook in `/src/lib/hooks/useDataFetching.ts`
4. Add to status API for health monitoring

### Updating Widget Order

Edit `DEFAULT_WIDGETS` array in `/src/lib/contexts/DashboardLayoutContext.tsx`

Note: Existing users keep their saved order in localStorage.

---

## Database

**Project**: siouxland-online-neon
**Neon Project ID**: shy-violet-53187602
**Endpoint**: ep-calm-wave-ahyf5m61

### Tables

**Application Data:**
- `weather_observations` - Historical weather data
- `river_readings` - River gauge readings
- `air_quality_readings` - AQI history
- `weather_alerts` - NWS alerts
- `traffic_incidents` - Traffic events
- `gas_stations` / `gas_prices` - Gas price data
- `chat_sessions` / `chat_messages` - Chat logs
- `suggestions` - User feedback
- `system_logs` - API health logs

**User Features:**
- `push_subscriptions` - Web push notification subscriptions
- `alert_subscriptions` - User alert preferences
- `watchlist_items` - User favorites (cameras, routes, etc.)
- `triggered_alerts` - Alert deduplication log
- `user_preferences` - Synced user settings

**Neon Auth (neon_auth schema):**
- `user`, `session`, `account`, `verification` - Managed by Neon Auth

**Council Meetings:**
- `council_meetings` - Meeting metadata, recap, status, transcript
- `council_meeting_chunks` - Transcript chunks with vector embeddings for semantic search

---

## Vercel Workflows

This project uses [Vercel Workflow DevKit](https://useworkflow.dev) for durable, long-running background tasks. Workflow files live in `/workflows/`.

### Key Concepts

- **`"use workflow"`** — marks the top-level orchestrator function. Code here is replayed on retries. **Global `fetch` is NOT available** in the workflow body.
- **`"use step"`** — marks an individual step function. Steps are the unit of execution: they get a real `fetch`, their results are cached on replay, and they retry automatically on failure.

### Critical Rule: All I/O Must Be in Steps

Vercel Workflows sandbox the global `fetch` inside `"use workflow"` functions. Any library that uses `fetch` under the hood — **including the Neon serverless driver, AI SDK, and any HTTP-based client** — will throw `"Global fetch is unavailable in workflow functions"` if called outside a `"use step"` block.

**Wrong** — bare DB call in workflow body:
```typescript
export async function myWorkflow() {
  "use workflow"
  const result = await sql`SELECT * FROM table` // FAILS — no fetch available
}
```

**Correct** — DB call wrapped in a step:
```typescript
async function queryStep(): Promise<Row[]> {
  "use step"
  const result = await sql`SELECT * FROM table` // Works — step provides fetch
  return result.rows
}

export async function myWorkflow() {
  "use workflow"
  const rows = await queryStep() // Call the step from workflow
}
```

### Step Return Values

Step return values are serialized and persisted in the workflow state store for replay. Return simple, serializable objects from steps — not full domain objects with methods or circular references.

### Current Workflows

- **`/workflows/digest-workflow.ts`** — Daily digest generation workflow
  - Route: `POST /api/workflow/digest`
  - Triggered by: Vercel Cron or admin panel

**Note:** Council meeting ingestion was originally a workflow but was converted to an SSE streaming route (see below) because the workflow's `fetch` sandboxing conflicted with the Neon serverless driver and external API calls.

### Debugging Workflows

- Runtime logs appear in the Vercel dashboard "Logs" tab (not available via MCP — use the Vercel dashboard or `vercel logs` CLI)
- Build logs are available via the Vercel MCP `get_deployment_build_logs` tool
- Workflow errors often manifest as `NeonDbError` wrapping the real issue — check the `sourceError` field

---

## City Council Meeting Ingestion Pipeline

Automated pipeline that fetches YouTube captions from Sioux City Council meetings, generates AI recaps, creates vector embeddings, and stores everything for semantic search.

**Implementation:** SSE (Server-Sent Events) streaming route — NOT a Vercel Workflow. This allows local testing with `next dev` and avoids the workflow `fetch` sandbox issues with Neon/OpenAI/OpenRouter.

### Architecture

```
YouTube RSS → Transcript Fetch → 5-min Chunking → AI Recap → Embeddings → Neon DB
                                                                              ↓
                                                            SSE progress events → Admin Panel
```

### Key Files

- `/src/app/api/workflow/council-ingest/route.ts` — SSE streaming route (POST=ingest with progress, GET=stats)
- `/src/lib/fetchers/council-meetings.ts` — RSS parsing, transcript fetching, chunking, AI recap
- `/src/lib/db/council-meetings.ts` — Database operations (upsert, status, chunks, search)
- `/src/lib/ai/embeddings.ts` — Vector embedding generation (OpenAI direct, not OpenRouter)
- `/src/app/api/cron/ingest-meetings/route.ts` — Cron trigger (calls the SSE route)
- `/src/app/api/council-meetings/recaps/route.ts` — API for fetching recaps
- `/src/app/council/page.tsx` — Council meetings UI page
- `/src/components/dashboard/CouncilWidget.tsx` — Dashboard widget
- `/src/components/admin/CouncilIngestPanel.tsx` — Admin panel with live SSE progress log

### Pipeline Steps

1. **RSS Fetch** — Fetch YouTube RSS feed for channel `UCrekGAbOEqDvdzn9w8FAcoQ`
2. **Filter** — Check DB for already-ingested videos, skip completed, retry failed/no_captions within 48hrs
3. **Upsert Meeting** — Create or update meeting record in DB (status → `processing`)
4. **Fetch Transcript** — Fetch YouTube captions via `youtube-transcript-plus`
5. **Chunk Transcript** — Split transcript into ~5-minute windows with start/end timestamps
6. **Generate Recap** — AI recap via Claude Sonnet 4.5 (OpenRouter) with staged summarization for >100K char transcripts
7. **Generate Embeddings** — Generate `text-embedding-3-small` vectors for each chunk (OpenAI direct)
8. **Store Results** — Persist chunks with embeddings, recap, and raw transcript to Neon

### SSE Event Protocol

The POST endpoint streams events:
- `event: progress` — Step-by-step updates with `{ step, message, videoId, current, total }`
- `event: error` — Per-video errors with `{ videoId, message }`
- `event: complete` — Final result with `{ success, processed, skipped, failed, noCaptions }`

### Transcript Fetching — Known Issues

- **Library**: Uses `youtube-transcript-plus` (NOT `youtube-transcript` — that library is broken as of Feb 2026, returns empty responses due to YouTube anti-bot changes)
- **Offset units**: The library returns `offset`/`duration` in **seconds**. Our `TranscriptSegment` type uses **milliseconds**. The `fetchTranscript()` function converts with `* 1000`.
- **Retry logic**: Videos marked `no_captions` are retried within 48 hours. Failed videos are always retried on next run.

### AI Models Used

- **Recap generation**: `anthropic/claude-sonnet-4.5` via OpenRouter
- **Staged summarization**: For transcripts >100K chars, sections are summarized individually then combined
- **Embeddings**: `openai/text-embedding-3-small` via OpenRouter (1536 dimensions)

---

## SUX Personality & Voice

SUX is the AI personality behind all public-facing content on Siouxland Online. The canonical definition lives in `src/lib/ai/sux-personality.ts` and is imported by all AI system prompts (chat, digest, council recaps).

When writing content as SUX — social media posts, marketing copy, newsletter text, council recaps, chat responses, or any public-facing writing — embody this voice:

- **Identity**: SUX = Siouxland AI Assistant, named after the Sioux Gateway Airport code. Self-aware about the name ("yes, the airport code — we've heard all the jokes").
- **Tone**: Midwestern warm. Genuine, approachable, not performative. Like a well-informed neighbor sharing what's going on, not a news anchor reading a teleprompter.
- **Language**: Plain English always. No jargon, no legalese, no corporate-speak. "Your property taxes" not "ad valorem assessments."
- **Humor**: Dry, light, never forced. Never sarcastic or punching down. Occasional self-deprecation about the name is fair game.
- **Directness**: Respect people's time. Lead with what matters. Three sentences beats three paragraphs.
- **Address**: Talk to people, not at them. "You'll want a coat today" not "Residents should dress warmly."
- **Regional flavor**: Reference the 712, the tri-state, the Missouri and Big Sioux rivers, I-29, Historic 4th Street, the Loess Hills, Chris Larsen Park, Sergeant Floyd Monument. Know the brutal winters, tornado season, and that "Siouxland" means the tri-state metro.
- **Community investment**: SUX genuinely cares about Sioux City. When reporting on council decisions, explain what they mean for real people — taxes, commutes, neighborhoods, utilities.
- **Sign-off**: Brief and human, as "SUX." Not a corporate tagline.
- **Transparency**: SUX is AI. Never hide it. AI-generated content should be clearly identifiable as such.
- **Accuracy**: Never fabricate data. "I don't have that info" is always better than guessing.

---

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEON_AUTH_BASE_URL` - Neon Auth endpoint

Optional:
- `OPENROUTER_API_KEY` - AI models for council recap + embeddings + chat
- `AIRNOW_API_KEY` - For air quality data
- `ELEVENLABS_API_KEY` - Voice agent
- `ELEVENLABS_AGENT_ID` - Voice agent
- `NEXT_PUBLIC_VOICE_AGENT_ENABLED` - Enable voice feature
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web push public key
- `VAPID_PRIVATE_KEY` - Web push private key
- `CRON_SECRET` - Shared secret for Vercel Cron job auth
