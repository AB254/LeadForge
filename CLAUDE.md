# LeadForge Internal

## Architecture
Monorepo (npm workspaces + Turborepo):
- `apps/web` — Next.js 15 (App Router, TypeScript, Tailwind CSS v4, Shadcn patterns)
- `apps/api` — NestJS backend API (port 4000)
- `packages/database` — Prisma schema + client (PostgreSQL)
- `packages/shared` — Types, constants, validators
- `packages/ui` — Shared UI components
- `workers/scraper` — Playwright-based Google Maps scraper (BullMQ worker)
- `workers/analyzer` — Website analyzer + lead scorer (BullMQ worker)
- `docker/` — Docker Compose for PostgreSQL + Redis

## Commands
- `npm install` — Install all workspace dependencies
- `npm run dev` — Start all services via Turborepo
- `npm run dev:web` — Start Next.js frontend only
- `npm run dev:api` — Start NestJS API only
- `npm run db:generate` — Generate Prisma client
- `npm run db:push` — Push schema to database
- `npm run db:migrate` — Run database migrations
- `npm run db:seed` — Seed sample data
- `npm run db:studio` — Open Prisma Studio

## Setup
1. Start infrastructure: `docker compose -f docker/docker-compose.yml up -d`
2. Copy `.env.example` to `.env` and fill in keys
3. `npm install`
4. `npm run db:generate && npm run db:push`
5. `npm run db:seed` (optional)
6. `npm run dev`

## Key Patterns
- API: NestJS with modules at apps/api/src/modules/
- Scraping: BullMQ queue-based, Playwright browser pool
- AI: OpenAI/Anthropic/Gemini for analysis + outreach generation
- State: Zustand for UI, TanStack Query for server state
- Database: PostgreSQL via Prisma, all models in packages/database/prisma/schema.prisma
- Maps: Mapbox GL with react-map-gl

## Environment
Required: DATABASE_URL, REDIS_URL
AI keys: OPENAI_API_KEY, ANTHROPIC_API_KEY (at least one)
Maps: NEXT_PUBLIC_MAPBOX_TOKEN, MAPBOX_ACCESS_TOKEN
