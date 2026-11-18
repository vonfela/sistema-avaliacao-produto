# About
Engagement module - Products review system:

This is my first complete project result of postgraduation about AI Engineering by Coders University in partnership with ESIC Madrid International.

A platform where on the homepage you will see a list of products using N8N automation to do API injection from Amazon of the products with infinite scrolling, you can evaluate products when logged in/authenticated and there will be an IA integration using Mastra AI agents/sub-agents which will resume all reviews to give and optimized AI review.

Local project, this was not published public because I do not own an Vercel paid plan to host all my projects.

## Getting Started:

### Dependencies:

Requirements: [Bun](https://bun.sh) (or Node.js with npm/yarn/pnpm), plus Docker if you want to run the N8N automation locally.

Install all project dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install - Prefered for this project
```

Then copy `.env.example` to `.env.local` and fill in the values (Supabase URL and service role key, plus the optional OpenRouter/DeepSeek keys for the AI summary).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev - Prefered for this project
```

Open [http://localhost:3000] or 3001 port (http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


## Project architecture and structure:

The project was built following **SDD (Spec-Driven Development)**: every feature starts as a spec in `specs/`, becomes an implementation plan in `plans/`, and only then is coded. The architecture decisions live in `docs/ARCHITECTURE.md`.

The code is organized in layers, from the UI down to the database:

```
┌──────────────────────────────────────────────────────────────┐
│  N8N (Docker)  ──►  POST /api/v1/products  (Amazon products) │
└──────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│  app/          Next.js App Router (pages, layouts, routes)   │
│  features/     UI components + Zod schemas per feature       │
├──────────────────────────────────────────────────────────────┤
│  API           tRPC (/api/trpc)  +  REST (/api/v1/*)         │
├──────────────────────────────────────────────────────────────┤
│  server/       routers → services → repositories             │
│  mastra/       AI agent that summarizes the reviews          │
├──────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)  —  supabase/migrations/*.sql         │
└──────────────────────────────────────────────────────────────┘
```

```
.
├── app/                        # Next.js App Router
│   ├── (platform)/             # Home (product feed) and product detail page
│   │   └── products/[id]/
│   ├── auth/                   # Sign-in / sign-up pages and forms
│   └── api/
│       ├── trpc/[trpc]/        # tRPC handler (used by the front-end)
│       └── v1/                 # Public REST API (products, feedbacks, auth)
├── components/                 # Shared components (header, footer) + shadcn/ui
├── features/                   # Feature modules: components + Zod schemas
│   ├── products/               # Product feed with infinite scrolling
│   ├── feedbacks/              # Star rating, review form and review list
│   ├── ai-summaries/           # AI summary card
│   ├── sign-in/
│   └── sign-up/
├── server/                     # Back-end business logic (server-only)
│   ├── trpc/                   # tRPC init and root router
│   ├── auth/                   # HMAC-signed session cookie
│   ├── accounts/               # Account repository (bcrypt hashed passwords)
│   ├── products/               # Products router + cached repository
│   ├── feedbacks/              # Reviews router + repository
│   └── ai-summaries/           # Summary service (calls the Mastra agent)
├── mastra/                     # Mastra instance and AI agents
│   └── agents/product-summary-agent.ts
├── lib/                        # Env access, Supabase admin client, tRPC provider, utils
├── supabase/migrations/        # SQL migrations (accounts, products, feedbacks, AI summaries)
├── n8n/                        # Docker Compose for the self-hosted N8N stack
├── specs/                      # SDD specs (one per feature)
├── plans/                      # Implementation plans derived from the specs
└── docs/                       # Architecture and handoff documents
```

### Main flows

- **Product catalog:** N8N collects products from Amazon and injects them through `POST /api/v1/products` (accepts `{ name, link, image, description }`). The home page lists them with infinite scrolling (`useInfiniteQuery` + `IntersectionObserver`), backed by a `"use cache"` repository that is revalidated by tag whenever a new product arrives.
- **Authentication:** sign-up stores the password as a bcrypt hash; sign-in creates an `HttpOnly` session cookie signed with HMAC-SHA256 (no sessions table).
- **Reviews:** authenticated users rate a product (1–5 stars) and leave a comment. Each user has one review per product, and sending a new one replaces the previous.
- **AI summary:** after the product page responds, `after()` checks whether the reviews changed (count + last update) and, if so, the Mastra agent generates a new summary of all reviews, which is saved in `products_ai_summaries`.

## Stack:
### Backend:
- **TypeScript** — typed language for the whole project
- **Next.js 16** (App Router, Cache Components, `after()`) — server and API runtime
- **Supabase (PostgreSQL)** — database, accessed server-side with `@supabase/supabase-js` (service role, RLS enabled)
- **Zod** — input validation shared between front-end and back-end
- **bcryptjs** — password hashing
- **Node `crypto` (HMAC-SHA256)** — signed session cookies
- **nanoid** — ID generation

### API:
- **tRPC 11** — type-safe endpoints consumed by the front-end (`auth`, `products`, `feedbacks`, `signUp`)
- **REST (Next.js Route Handlers)** — public `/api/v1` contract for external integrations such as N8N:
  - `GET /api/v1/products?page=1&limit=12` — paginated product list
  - `POST /api/v1/products` — create a product
  - `GET/POST /api/v1/products/[id]/feedbacks` — product reviews
  - `POST /api/v1/sign-up`, `/api/v1/sign-in`, `/api/v1/sign-out` — authentication

### Front-end:
- **React 19** + **Next.js 16**
- **TailwindCSS 4** — styling
- **shadcn/ui** (Radix UI) + **lucide-react** — design system and icons
- **TanStack React Query** (via tRPC) — queries, mutations and infinite scrolling
- **React Hook Form** + **Zod** — forms and validation
- **date-fns** — date formatting
- **Biome** — lint and formatting
- **Bun** — package manager and runtime

### Automations and AI agents/sub-agents:
- **N8N** (self-hosted with Docker Compose, plus SearXNG for search) — automation that fetches products from Amazon and sends them to the REST API
- **Mastra AI** — `product-summary-agent`, which reads all reviews of a product and writes a short, neutral summary in Portuguese (positive and negative points, no invented information, protected against prompt injection inside the reviews)
- **LLM providers (via Mastra model fallback):**
  - Primary: `nvidia/nemotron-3-ultra-550b-a55b:free` through **OpenRouter** (free)
  - Fallback: `deepseek-flash` through **DeepSeek** (paid), used when the primary model fails or hits its limit
- **AI coding assistants (used during development, following SDD):**
  - Primary: **DeepSeek V4 Flash**
  - Secondary: **Claude Opus 5.5** (Anthropic), through **Claude Code**
