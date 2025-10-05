# Code Royale

Code Royale turns LeetCode-style practice into a live, spectator-friendly battle arena. Spin up a solo or multiplayer lobby, draft a problem from the LeetCode catalog, and race up the leaderboard inside a shared Monaco editor while friends cheer (or jeer) from the stands.

## What makes it different
- **100-player royale lobbies:** Ready-check gating, countdown timers, and difficulty-aware time limits keep every lobby fair whether you play solo or invite an army.
- **Problem scouting on tap:** The home explorer talks to the LeetCode dataset so you can search by slug, tags, or difficulty, then prefetch metadata and AI-enriched summaries before a match starts.
- **AI-assisted judging:** OpenRouter-backed actions generate problem-specific test suites, analyze submissions for time complexity, and help score players on speed, correctness, and efficiency.
- **Built-in execution sandbox:** The `/api/execute` endpoint streams runs through `piston-client`, giving contestants server-side compilation, stdin/out piping, and failure diagnostics without leaving the browser.
- **Spectate everything:** Real-time presence, remote cursors, scoreboards, and the Convex-powered spectator chat make every match a watch party.

## Gameplay loop
1. **Explore** featured or searched LeetCode problems from `app/page.tsx` and warm up with previews.
2. **Rally a lobby** at `/lobby`, where `useGameConnection` keeps presence, ready states, and countdowns in sync across participants.
3. **Compete** inside `/game/[slug]` with Monaco, shared cursors, code snapshots, piston-powered runs, and Convex mutations that record scores and eliminations.
4. **Spectate or review** from `/spectate` and the ending dashboards to study timelines, chat logs, and the final grade breakdown.

## Tech stack
- **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS 4, Shadcn UI, and Monaco for the editor experience.
- **Realtime + data:** Convex handles auth (`@convex-dev/auth`), lobby presence, chat, scoreboards, generated test cases, and game lifecycle mutations.
- **AI services:** OpenRouter models (Gemini 2.5, GPT-5 series) drive test-case generation and qualitative scoring helpers.
- **Execution:** `piston-client` proxies to Piston for multi-language code execution during matches.
- **Tooling:** Bun, TypeScript 5, npm-run-all orchestration, Biome lint/format, and React Query for client caching.

## Getting started locally
1. Install Bun (v1.1+) and the Convex CLI (`bunx convex dev --help`).
2. Copy `.env.local` and fill required keys:
   - `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_SITE_URL` (from your Convex deployment)
   - `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_BASE_URL` (typically `http://localhost:3000` in dev)
   - `OPENROUTER_API_KEY` (for AI test generation)
   - Optional: `RESEND_API_KEY` if you enable transactional email flows
3. Install dependencies: `bun install`.
4. Run everything: `bun run dev` (spawns `next dev` and `convex dev` in parallel; the first run may ask you to log into Convex).
5. Visit `http://localhost:3000`, sign in via Convex Auth, and open a lobby to start a match.

### Useful scripts
- `bun run lint` – Biome lint across the repo
- `bun run format` – Biome formatting (unsafe writes)
- `bun run convex:deploy` – Push Convex schema/functions to production

## Repository landmarks
- `app/` – Next.js App Router routes for home, lobbies, live games, auth, and spectator flows
- `components/` – UI primitives plus arenas: `home/`, `CodeExecutor`, `SpectatorChat`, and hooks like `useGameConnection`
- `convex/` – Convex schema, queries, mutations, and AI-backed actions (test case generation, scoring, presence)
- `lib/` – Utilities including OpenRouter clients and scoring math
- `scripts/` – Maintenance helpers (e.g., piston smoke tests, data migrations)

Ready to crown the next champion? Launch a lobby, drop a LeetCode slug, and let the royale begin.
