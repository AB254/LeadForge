# LeadForge Internal

Private, internal AI-powered lead generation platform. Scrapes Google Maps for businesses, analyzes their web presence, scores them as potential leads, and generates personalized outreach — all from a single dashboard.

> **Internal use only.** Not intended for public distribution.

---

## Features

| Feature | Description |
|---|---|
| **Google Maps Scraper** | Playwright-based scraper that pulls business listings by keyword and location |
| **Website Analyzer** | Crawls each lead's website to evaluate design quality, tech stack, SEO health, and performance |
| **AI Lead Scoring** | Scores and prioritizes leads using configurable AI models (OpenAI / Anthropic / Gemini) |
| **Outreach Generator** | Creates personalized email and message drafts based on analyzed pain points |
| **Interactive Map** | Mapbox GL map view with clustering, filters, and click-to-detail |
| **Campaign Management** | Organize leads into campaigns, track outreach status, and measure conversions |
| **Export** | CSV and spreadsheet export of filtered lead data |
| **Real-Time Dashboard** | Live stats, charts, and queue monitoring |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS v4, Shadcn/ui patterns |
| Backend API | NestJS (Node.js) |
| Database | PostgreSQL 16 via Prisma ORM |
| Queue / Cache | Redis 7 + BullMQ |
| Scraping | Playwright (Chromium) |
| AI | OpenAI, Anthropic Claude, Google Gemini |
| Maps | Mapbox GL JS, react-map-gl |
| Monorepo | npm workspaces + Turborepo |
| Containers | Docker Compose |

---

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10
- **Docker** and **Docker Compose** (for PostgreSQL + Redis)
- At least one AI API key (OpenAI or Anthropic)
- Mapbox access token (for map features)

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> leadforge-internal
cd leadforge-internal

# 2. Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, API keys

# 4. Install dependencies
npm install

# 5. Set up the database
npm run db:generate
npm run db:push
npm run db:seed        # optional: loads sample data

# 6. Start all services
npm run dev
```

The web app will be available at **http://localhost:3000** and the API at **http://localhost:4000**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (3000)                      │
│              Next.js 15 — App Router + RSC               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────────────┐
│                    NestJS API (4000)                      │
│        Auth · Leads · Campaigns · Scrape · AI            │
└────┬──────────────┬──────────────────┬──────────────────┘
     │              │                  │
     ▼              ▼                  ▼
┌─────────┐  ┌───────────┐  ┌──────────────────┐
│ Postgres │  │   Redis   │  │   BullMQ Queues  │
│  (5432)  │  │  (6379)   │  │                  │
└─────────┘  └───────────┘  └────┬────────┬────┘
                                  │        │
                          ┌───────▼──┐ ┌───▼────────┐
                          │ Scraper  │ │  Analyzer   │
                          │ Worker   │ │  Worker     │
                          │Playwright│ │ AI scoring  │
                          └──────────┘ └────────────┘
```

---

## Project Structure

```
leadforge-internal/
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/          # App Router pages + API routes
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── lib/          # Utilities, API client
│   │   │   └── stores/       # Zustand stores
│   │   └── package.json
│   └── api/                  # NestJS backend
│       ├── src/
│       │   ├── modules/      # Feature modules
│       │   ├── common/       # Guards, interceptors, pipes
│       │   └── main.ts
│       └── package.json
├── packages/
│   ├── database/             # Prisma schema + client
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   ├── shared/               # Constants, types, validators
│   │   └── src/
│   └── ui/                   # Shared UI components (placeholder)
│       └── src/
├── workers/
│   ├── scraper/              # Google Maps scraper worker
│   └── analyzer/             # Website analyzer + scorer worker
├── docker/
│   ├── docker-compose.yml    # PostgreSQL + Redis
│   ├── Dockerfile.api        # NestJS production image
│   ├── Dockerfile.web        # Next.js production image
│   └── Dockerfile.worker     # Worker production image
├── package.json              # Workspace root
├── turbo.json                # Turborepo config
└── tsconfig.json             # Base TypeScript config
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `OPENAI_API_KEY` | One AI key | OpenAI API key |
| `ANTHROPIC_API_KEY` | One AI key | Anthropic Claude API key |
| `GOOGLE_GEMINI_API_KEY` | No | Google Gemini API key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public token (frontend) |
| `MAPBOX_ACCESS_TOKEN` | Yes | Mapbox secret token (server) |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `NEXTAUTH_SECRET` | Yes | NextAuth session secret |
| `NEXTAUTH_URL` | No | NextAuth base URL (default: http://localhost:3000) |

Default database URL for local Docker setup:
```
DATABASE_URL="postgresql://leadforge:leadforge@localhost:5432/leadforge?schema=public"
REDIS_URL="redis://localhost:6379"
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/auth/register` | Create a new user account |
| `GET` | `/api/leads` | List leads (paginated, filterable) |
| `GET` | `/api/leads/:id` | Get lead details |
| `PATCH` | `/api/leads/:id` | Update a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/leads/export` | Export leads to CSV |
| `POST` | `/api/scrape` | Start a new scrape job |
| `GET` | `/api/scrape/:jobId` | Get scrape job status |
| `GET` | `/api/campaigns` | List campaigns |
| `POST` | `/api/campaigns` | Create a campaign |
| `POST` | `/api/outreach/generate` | Generate AI outreach draft |
| `POST` | `/api/analyze` | Trigger website analysis |
| `GET` | `/api/dashboard/stats` | Dashboard summary statistics |
| `GET` | `/api/queue/status` | BullMQ queue health |

---

## Development Workflow

```bash
# Run only the frontend
npm run dev:web

# Run only the API
npm run dev:api

# Run workers
npm run dev:workers

# Open Prisma Studio (database GUI)
npm run db:studio

# After changing the Prisma schema
npm run db:generate
npm run db:migrate

# Lint all packages
npm run lint

# Build everything
npm run build
```

---

## Legal and Compliance

- This tool scrapes **publicly available** business data from Google Maps. No private or protected data is collected.
- All scraping operations implement **rate limiting** and **polite delays** to avoid overloading external services.
- Outreach messages are **drafts** that require human review before sending.
- Ensure your usage complies with Google's Terms of Service and applicable data protection regulations (GDPR, CAN-SPAM, etc.).
- This software is provided for **internal use only** and is not licensed for redistribution.
