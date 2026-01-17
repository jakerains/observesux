# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router routes and layouts. API routes live under `src/app/api/`.
- `src/components/`: UI and dashboard widgets. Shared shadcn/ui pieces are in `src/components/ui/`.
- `src/lib/`: Data fetchers, hooks, contexts, and DB helpers.
- `src/types/`: Shared TypeScript types.
- `public/`: Static assets served as-is.
- Root config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.

## Build, Test, and Development Commands
- `pnpm dev`: Start the local Next.js dev server (http://localhost:3000).
- `pnpm build`: Create a production build.
- `pnpm start`: Run the production server after building.
- `pnpm lint`: Run ESLint (Next.js core-web-vitals + TypeScript rules).

Use pnpm for all installs and scripts; keep `pnpm-lock.yaml` up to date.

## Coding Style & Naming Conventions
- TypeScript + React (App Router). Follow existing formatting: 2-space indentation, single quotes, no semicolons in TS/TSX.
- Prefer path aliases via `@/` for imports from `src/`.
- Components use `PascalCase` filenames (e.g., `WeatherWidget.tsx`); hooks use `useSomething.ts`.
- Tailwind CSS v4 is the primary styling system; keep class strings readable and grouped.

## Testing Guidelines
There is no automated test runner configured yet. Validate changes with:
- `pnpm lint`
- `pnpm build`
- Manual UI checks in `pnpm dev`

If you introduce tests, document the framework and commands in this file.

## Commit & Pull Request Guidelines
- Git history follows Conventional Commits (`feat:`, `fix:`, `chore:`). Keep messages short and scoped.
- PRs should include a clear description, testing notes, and screenshots/GIFs for UI changes.
- For version bumps or user-facing updates, follow the changelog workflow in `CLAUDE.md` and update `CHANGELOG.md` plus `src/components/dashboard/ChangelogModal.tsx`.

## Configuration & Secrets
- Copy `.env.local.example` to `.env.local` and fill in keys. Do not commit secrets.
- `AIRNOW_API_KEY` enables air quality data; `DATABASE_URL` is optional for historical storage.

## Agent Notes
- For widget or data-source changes, review the conventions in `CLAUDE.md` before coding.
