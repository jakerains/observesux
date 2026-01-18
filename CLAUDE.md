# Claude Code Instructions for ObserveSUX

Project-specific instructions for Claude Code when working on this codebase.

## Project Overview

ObserveSUX is a real-time observability dashboard for Sioux City, Iowa. It aggregates data from multiple public APIs (weather, traffic, transit, etc.) into a responsive dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui
- **Data Fetching**: SWR with polling intervals
- **Database**: Neon Serverless PostgreSQL
- **Maps**: Leaflet + React-Leaflet

## Key Directories

- `/src/app/api/` - API routes that proxy external data sources
- `/src/components/dashboard/` - Widget components
- `/src/lib/hooks/` - Custom hooks including `useDataFetching.ts`
- `/src/lib/contexts/` - React contexts for state management
- `/src/types/` - TypeScript type definitions

---

## Changelog Management

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

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string

Optional:
- `AIRNOW_API_KEY` - For air quality data
- `ELEVENLABS_API_KEY` - Voice agent
- `ELEVENLABS_AGENT_ID` - Voice agent
- `NEXT_PUBLIC_VOICE_AGENT_ENABLED` - Enable voice feature
