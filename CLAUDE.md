# Claude Code Instructions for Siouxland Online

Project-specific instructions for Claude Code when working on this codebase.

## Project Overview

Siouxland Online is a real-time community dashboard for Sioux City, Iowa. It aggregates data from multiple public APIs (weather, traffic, transit, gas prices, events, etc.) into a responsive dashboard with AI-powered recaps for city meetings.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui
- **Data Fetching**: SWR with polling intervals
- **Database**: Neon Serverless PostgreSQL (siouxland-online-neon / shy-violet-53187602)
- **Auth**: Neon Auth (Better Auth)
- **AI**: OpenRouter (Claude Sonnet 4.6 default, configurable per-context via admin panel)
- **Embeddings**: OpenRouter (`text-embedding-3-small`, 1536 dimensions)
- **Maps**: Leaflet + React-Leaflet
- **Notifications**: Expo Push (mobile) + Web Push API
- **Mobile App**: Expo / React Native (in `/expo-app/`)
- **Package Manager**: **pnpm** (not npm)

## Key Directories

- `/src/app/api/` - API routes that proxy external data sources
- `/src/app/api/user/` - User-specific API routes (alerts, watchlist, preferences)
- `/src/app/api/cron/` - Cron job routes (meetings, alerts, digest, gas prices, events, expo receipts)
- `/src/app/auth/` - Authentication pages (sign-in, sign-up)
- `/src/app/account/` - Account settings pages
- `/src/app/council/` - Meeting recaps list and detail pages
- `/src/components/dashboard/` - Widget components
- `/src/components/admin/` - Admin panel components (ingest, model config, etc.)
- `/src/components/alerts/` - Alert subscription components
- `/src/components/watchlist/` - Watchlist/favorites components
- `/src/lib/auth/` - Neon Auth client and server utilities
- `/src/lib/ai/` - AI config, embeddings, SUX personality, chat tools
- `/src/lib/hooks/` - Custom hooks including `useDataFetching.ts`
- `/src/lib/contexts/` - React contexts for state management
- `/src/lib/db/` - Database operations and migrations
- `/src/lib/fetchers/` - External data source fetchers
- `/src/types/` - TypeScript type definitions
- `/expo-app/` - Expo/React Native mobile app

---

## Git Workflow

**Do NOT auto-push.** Each push triggers a Vercel production build that costs money.

1. **Commit locally** as many times as needed — no push
2. **Wait for the user to say "push"** or "commit and push"
3. **At push time**: bump the version, write one changelog entry covering all commits since the last push, then push

Use `pnpm build` (not `vercel build`) for local verification.

---

## Changelog Management

When the user says "push" or "commit and push", bump the version and update the changelog covering all commits since the last push:
- **Patch bump** (Z) for most changes — bug fixes, small features, tweaks
- **Minor bump** (Y) for significant new features or large updates
- Then follow the changelog steps below.

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

### 3. Review Changes Since Last Push

Look at git history to identify all changes since the last push:

```bash
git log --oneline origin/main..HEAD
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

Follow the [Keep a Changelog](https://keepachangelog.com) format.

**Important: The changelog is user-facing.** Write entries in plain language that non-developers can understand. Avoid technical jargon (no "memoized", "debounced", "refs", "callback recreation", etc.). Focus on what changed for the user. Admin-only changes should be prefixed with "(Admin)". Don't include internal refactors or code cleanup unless they visibly affect the user experience.

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
pnpm build
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
**Env var**: `sux_DATABASE_URL` (preferred) or `DATABASE_URL` (fallback)

### Tables

**Application Data:**
- `weather_observations` - Historical weather data
- `river_readings` - River gauge readings
- `air_quality_readings` - AQI history
- `weather_alerts` - NWS alerts
- `traffic_incidents` - Traffic events
- `gas_stations` / `gas_prices` - Gas price data (cron with station blocklist)
- `chat_sessions` / `chat_messages` - Chat logs
- `suggestions` - User feedback
- `system_logs` - API health logs
- `app_settings` - Admin-configurable settings (model selection, etc.)

**User Features:**
- `push_subscriptions` - Web push notification subscriptions
- `device_push_subscriptions` - Expo push token subscriptions (mobile)
- `alert_subscriptions` - User alert preferences
- `watchlist_items` - User favorites (cameras, routes, etc.)
- `triggered_alerts` / `device_triggered_alerts` - Alert deduplication logs
- `user_preferences` - Synced user settings

**Neon Auth (neon_auth schema):**
- `user`, `session`, `account`, `verification` - Managed by Neon Auth

**Council / Community Meetings:**
- `council_meetings` - Meeting metadata, recap, status, transcript, meeting_type
  - `meeting_type` column: `city_council` (default), `budget_session`, `school_board`, `planning_zoning`, `special_session`, `other`
  - `status` column: `pending`, `processing`, `draft`, `completed`, `failed`, `no_captions`, `dismissed`
- `council_meeting_chunks` - Transcript chunks with vector embeddings for semantic search
- `council_meeting_versions` - Historical recap version snapshots

---

## Vercel Workflows

This project uses [Vercel Workflow DevKit](https://useworkflow.dev) for durable, long-running background tasks. Workflow files live in `/workflows/`.

### Key Concepts

- **`"use workflow"`** — marks the top-level orchestrator function. Code here is replayed on retries. **Global `fetch` is NOT available** in the workflow body.
- **`"use step"`** — marks an individual step function. Steps are the unit of execution: they get a real `fetch`, their results are cached on replay, and they retry automatically on failure.

### Critical Rule: All I/O Must Be in Steps

Vercel Workflows sandbox the global `fetch` inside `"use workflow"` functions. Any library that uses `fetch` under the hood — **including the Neon serverless driver, AI SDK, and any HTTP-based client** — will throw `"Global fetch is unavailable in workflow functions"` if called outside a `"use step"` block.

### Current Workflows

- **`/workflows/digest-workflow.ts`** — Daily digest generation workflow
  - Route: `POST /api/workflow/digest`
  - Triggered by: Vercel Cron or admin panel

**Note:** Council meeting ingestion was originally a workflow but was converted to an SSE streaming route (see below) because the workflow's `fetch` sandboxing conflicted with the Neon serverless driver and external API calls.

---

## Meeting Ingestion Pipeline

Automated pipeline that processes city meeting transcripts — city council, budget sessions, school board, and other community meetings. Generates AI recaps, creates vector embeddings, and stores everything for semantic search.

**Implementation:** SSE (Server-Sent Events) streaming route — NOT a Vercel Workflow. Max duration: 300 seconds.

### Architecture

```
YouTube RSS (council) ──┐
                        ├→ Transcript Fetch → 5-min Chunking → Embeddings → Checkpoint (draft)→ AI Recap → Store
Admin URL / Upload ─────┘                                                                         ↓
                                                                              SSE progress events → Admin Panel
```

### Pipeline Order (resilient — checkpoint before recap)

1. **Transcript** — Fetch from YouTube (auto) or accept pasted/uploaded text
2. **Chunk** — Split into ~5-minute windows with start/end timestamps
3. **Embed** — Generate `text-embedding-3-small` vectors for each chunk (batches of 5)
4. **Checkpoint** — Save transcript + chunks + embeddings to DB, set status to `draft`. If the function times out during recap, this work is preserved.
5. **Recap** — AI recap via configurable model (default Claude Sonnet 4.6 via OpenRouter). Staged summarization for transcripts >200K chars.

### Draft / Publish Workflow

- **Manual processing** (admin retry, upload, recap-only) → saves as `draft`
- **Automated cron** (weekly council RSS) → saves as `completed` (auto-publish)
- Admin reviews drafts and clicks **Publish** to make public, or **Unpublish** to revert
- Push notifications are only sent on publish, not when drafted

### Meeting Types

Meetings have a `meeting_type` field. Types: `city_council` (default), `budget_session`, `school_board`, `planning_zoning`, `special_session`, `other`. Each type gets a tailored AI recap prompt while keeping the SUX personality.

### Admin Panel Ingestion Modes

- **Run Ingestion** — Bulk RSS fetch for council channel (auto-publish)
- **Add Meeting from URL** — Paste YouTube URL + pick type → fetches title via oEmbed, creates `pending` record (no processing)
- **Upload Transcript** — Paste text or drop `.txt`/`.md` file with meeting type selector
- **Full Reprocess** — Re-runs entire pipeline for a meeting
- **Generate Recap** — Runs only the recap step on an already-saved transcript (for timeout recovery)
- **Recap Only (Regenerate)** — Regenerates recap from existing transcript without re-fetching

### Key Files

- `/src/app/api/workflow/council-ingest/route.ts` — SSE streaming route (POST=ingest, GET=stats)
- `/src/lib/fetchers/council-meetings.ts` — RSS parsing, transcript fetching, chunking, AI recap, type-aware prompts
- `/src/lib/db/council-meetings.ts` — DB operations (upsert, search, slug resolution, publish/unpublish)
- `/src/lib/ai/embeddings.ts` — Vector embedding generation
- `/src/lib/ai/model-config.ts` — Per-context model selection with admin UI
- `/src/app/api/cron/ingest-meetings/route.ts` — Cron trigger (Tue 5am + 4pm UTC)
- `/src/app/api/council-meetings/recaps/route.ts` — Public recaps API (supports `?type=` filter)
- `/src/app/council/page.tsx` — Meeting recaps list with type filter tabs
- `/src/app/council/[slug]/` — Detail page with OG images, sharing, type badges
- `/src/components/dashboard/CouncilWidget.tsx` — Dashboard widget (city council only)
- `/src/components/admin/CouncilIngestPanel.tsx` — Admin panel with pipeline progress UI

### Slugs

- City council: `/council/2026-01-26` (bare date, backward compatible)
- Other types: `/council/2026-01-26-budget_session` (composite slug)
- Parsed by `parseSlug()` in `council-meetings.ts`

### Transcript Fetching

- Uses `youtube-transcript` package (InnerTube API) for YouTube captions with real per-segment timestamps
- Manual upload path accepts pasted text or `.txt`/`.md` file drops
- Videos marked `no_captions` or `failed` are retried on next cron run

### SSE Event Protocol

The POST endpoint streams events:
- `event: progress` — Step updates with `{ step, message, videoId, embeddingsDone, embeddingsTotal, chunkCount, segmentCount }`
- `event: error` — Per-video errors with `{ videoId, message }`
- `event: complete` — Final result with `{ success, processed, skipped, failed, noCaptions }`

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
- `sux_DATABASE_URL` - Neon PostgreSQL connection string (preferred over `DATABASE_URL`)
- `DATABASE_URL` - Neon PostgreSQL connection string (fallback)
- `NEON_AUTH_BASE_URL` - Neon Auth endpoint

Optional:
- `OPENROUTER_API_KEY` - AI models for council recap + embeddings + chat
- `AIRNOW_API_KEY` - For air quality data
- `FIRECRAWL_API_KEY` - For events scraping
- `ELEVENLABS_API_KEY` - Voice agent
- `ELEVENLABS_AGENT_ID` - Voice agent
- `NEXT_PUBLIC_VOICE_AGENT_ENABLED` - Enable voice feature
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web push public key
- `VAPID_PRIVATE_KEY` - Web push private key
- `EXPO_ACCESS_TOKEN` - Expo push notification sending
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics (mobile app)
- `CRON_SECRET` - Shared secret for Vercel Cron job auth
