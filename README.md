# DebateAI — Challenge Your Convictions

An AI debate platform where users defend their beliefs against AI opponents trained to argue from every perspective. Real-time streaming responses with web search citations, scoring, and shareable debates.

**Live:** [debateai.org](https://debateai.org)

---

## Features

- **AI-Powered Debates** — Claude Sonnet with web search for real-time, cited counterarguments
- **Multiple Personas** — Daily rotating opponents or custom debate styles
- **Real-time Streaming** — SSE-based streaming with character-by-character delivery
- **AI Takeover** — Let AI argue your side (via OpenAI) when you're stuck
- **Debate Scoring** — AI-judged results with roast levels and verdicts
- **Sharing** — Share API, embeddable iframes, OG previews for social platforms
- **Blog** — Markdown-based blog with SEO (gray-matter + marked)
- **Freemium** — Message limits for free users, unlimited for premium (Stripe)
- **SEO** — Dynamic robots.txt, sitemap, OG tags, JSON-LD structured data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| AI (Debates) | Claude Sonnet via Anthropic SDK (web search tool) |
| AI (Takeover) | OpenAI via Helicone gateway |
| Auth | Clerk |
| Database | Cloudflare D1 (SQLite) |
| Payments | Stripe (subscriptions) |
| Hosting | Vercel |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm or npm
- API keys (see Environment Variables below)

### Setup

```bash
# Clone
git clone git@github.com:colegottdank/debateai.git
cd debateai

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys (see below)

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# === Required ===

# Clerk Authentication (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Anthropic AI — powers debate responses (https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Cloudflare D1 — primary database (https://dash.cloudflare.com)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_D1_DATABASE_ID=...
CLOUDFLARE_EMAIL=...

# === Optional ===

# Helicone — AI observability gateway (https://helicone.ai)
HELICONE_API_KEY=...

# Stripe — payments (https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brave Search — trending topics (https://brave.com/search/api)
BRAVE_SEARCH_API_KEY=...

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_DISABLED=false

# Development only
NEXT_PUBLIC_TEST_MODE=false
LOCAL_DEV_BYPASS=false  # Ignored in production
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── debate/           # Core debate endpoints
│   │   │   ├── route.ts      # POST — send message (streams Claude response)
│   │   │   ├── create/       # POST — create debate
│   │   │   ├── takeover/     # POST — AI argues user's side
│   │   │   └── [debateId]/   # GET/POST — debate CRUD
│   │   ├── debates/          # GET — list user's debates
│   │   ├── share/[debateId]/ # GET — share metadata (public)
│   │   ├── embed/[debateId]/ # GET — embeddable HTML (public)
│   │   ├── og/               # GET — OG image generation (Edge)
│   │   ├── trending/         # GET — AI-generated trending topics
│   │   ├── stripe/           # Checkout, manage, webhook, price
│   │   ├── subscription/     # GET — user subscription status
│   │   └── profile/          # GET/POST — user profile
│   ├── debate/
│   │   └── [debateId]/
│   │       ├── page.tsx      # Server component (SSR for SEO)
│   │       ├── DebateClient.tsx  # Client component (interactivity)
│   │       └── layout.tsx    # Dynamic OG metadata
│   ├── blog/                 # Blog pages (server-rendered)
│   ├── robots.ts             # Dynamic robots.txt
│   ├── sitemap.ts            # Dynamic sitemap (D1-backed)
│   └── layout.tsx            # Root layout + JSON-LD
├── components/               # Reusable UI components
├── lib/
│   ├── d1.ts                # Cloudflare D1 client
│   ├── rate-limit.ts        # In-memory rate limiter
│   ├── blog.ts              # Blog post loader (gray-matter + marked)
│   ├── jsonld.ts            # JSON-LD structured data
│   ├── analytics.ts         # Provider-agnostic event tracking
│   ├── stripe.ts            # Stripe client
│   ├── opponents.ts         # AI persona definitions
│   ├── prompts.ts           # System prompts for debate AI
│   └── auth-helper.ts       # Clerk auth helpers
├── content/
│   └── blog/                # Markdown blog posts with frontmatter
├── docs/
│   ├── SHARE-EMBED-API.md   # Share & Embed API documentation
│   ├── LIGHTHOUSE-BASELINE.md # Performance audit baseline
│   └── SECURITY-ERROR-AUDIT.md # Security review
└── tests/                   # Playwright tests
```

## API Rate Limits

| Endpoint | Limit | Key |
|----------|-------|-----|
| `GET /api/share/[id]` | 60/min | IP |
| `GET /api/embed/[id]` | 30/min | IP |
| `GET /api/og` | 20/min | IP |
| `GET /api/trending` | 10/min | IP |
| `POST /api/debate` | 20/min | User + IP |
| `POST /api/debate/create` | 10/min | User + IP |
| `POST /api/debate/takeover` | 10/min | User + IP |

## Deployment

### Vercel (Production)

1. Connect GitHub repo to Vercel
2. Set all environment variables in Vercel dashboard
3. Deploy — auto-deploys on push to `main`

### Branch Strategy

- `main` — production (protected, requires PR)
- `feature/*` — feature branches
- `fix/*` — bug fix branches

## License

MIT
<!-- E2E Test Mon Feb  9 11:47:55 PST 2026 -->
