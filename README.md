# Code Royale

Multiplayer technical interviews meet battle royale energy. Code Royale pairs a Convex backend with a polished Next.js 15 UI so squads can discover coding challenges, spin up lobbies, and spectate live matches in real time.

## Tech stack

- **Runtime / Package manager:** Bun (Node.js 20+ also works)
- **Framework:** Next.js App Router (React 19)
- **Styling:** Tailwind CSS 4 + Shadcn UI
- **Backend:** Convex with `@convex-dev/auth`
- **Tooling:** Biome, npm-run-all, TypeScript 5

## Core features

- **Problem explorer:** browse curated coding problems with rich metadata and quick filtering.
- **Lobby flow:** create or join arenas, coordinate with teammates, and launch games once everyone is ready.
- **Spectate mode:** watch active matches, track presence, and follow crown-worthy plays.
- **Account & auth:** GitHub OAuth via Convex Auth keeps sign-in fast and secure.

## Prerequisites

- Bun ≥ 1.1 (or Node.js ≥ 20 if you prefer npm)
- A Convex account with access to the target project
- GitHub OAuth credentials for local sign-in
- Optional: OpenRouter API access for AI-powered features, email provider API key if enabling transactional email

## Installation

```bash
git clone <repo-url>
cd Stormhacks
bun install    # or npm install
```

## Environment configuration

Create a `.env.local` file in the project root with the following keys. Keep every value private—never commit this file.

| Variable | Description |
| --- | --- |
| `GITHUB_CLIENT_ID` | OAuth Client ID from your GitHub developer application. |
| `GITHUB_CLIENT_SECRET` | OAuth client secret that pairs with the above ID. |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier (e.g. `dev:your-team-123`). |
| `NEXT_PUBLIC_CONVEX_URL` | Public Convex URL for the same deployment. |
| `OPENROUTER_API_KEY` | (Optional) API key for OpenRouter-backed AI prompts. |
| `RESEND_API_KEY` | (Optional) Resend API key if you wire up transactional email. |

_First-time Convex setup_

1. Login once with `npx convex dev --login` (or `bunx convex dev --login`) and choose the project.
2. Ensure `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` match the selected deployment.

## Local development

```bash
bun run dev      # starts Next.js and Convex dev servers in parallel
```

The `predev` script seeds Convex Auth helpers the first time it runs. If `.env.local` changes, restart the dev server so Convex picks up new values.

## Project scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Run Next.js + Convex development environment. |
| `bun run build` | Build the Next.js production bundle. |
| `bun run start` | Serve the production build. |
| `bun run lint` | Lint with Biome. |
| `bun run format` | Format with Biome. |
| `bun run check` | Biome check + autofix pass. |
| `bun run convex:deploy` | Deploy Convex functions to the configured deployment. |

## Deployment notes

1. Confirm production secrets are stored in your hosting provider (Vercel, etc.).
2. Run `bun run convex:deploy` to ship Convex functions.
3. Deploy the Next.js app using your platform of choice (`bun run build` + `bun run start`, or Vercel/GitHub integration).

For deeper customisation, explore the `convex/` directory for backend logic and `app/` + `components/` for UI modules.
