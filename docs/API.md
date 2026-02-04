# DebateAI API Reference

> **Base URL:** `https://debateai.org`
>
> **Auth:** [Clerk](https://clerk.com) session tokens. Authenticated endpoints require a valid Clerk session cookie or Bearer token.
>
> **Rate Limiting:** All endpoints include standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. When exceeded, a `Retry-After` header is also returned.

---

## Table of Contents

| # | Endpoint | Method | Auth | Description |
|---|----------|--------|------|-------------|
| 1 | [`/api/debate`](#1-post-apidebate) | POST | ✅ | Send a message in a debate (streams AI response) |
| 2 | [`/api/debate/create`](#2-post-apidebatecreate) | POST | ✅ | Create a new debate |
| 3 | [`/api/debate/takeover`](#3-post-apidebatetakeover) | POST | ✅ | AI writes the user's argument |
| 4 | [`/api/debate/[debateId]`](#4-get-apidebatedebateid) | GET | ❌* | Fetch a debate by ID |
| 5 | [`/api/debate/[debateId]`](#5-post-apidebatedebateid) | POST | ❌* | Post a message to a debate (legacy) |
| 6 | [`/api/debates`](#6-get-apidebates) | GET | ✅ | List user's debate history |
| 7 | [`/api/profile`](#7-get-apiprofile) | GET | ✅ | Get user profile |
| 8 | [`/api/profile`](#8-post-apiprofile) | POST | ✅ | Update display name |
| 9 | [`/api/subscription`](#9-get-apisubscription) | GET | ✅ | Get subscription status |
| 10 | [`/api/stripe/create-checkout`](#10-post-apistripecreate-checkout) | POST | ✅ | Create Stripe checkout session |
| 11 | [`/api/stripe/manage`](#11-post-apistripemanage) | POST | ✅ | Create Stripe customer portal session |
| 12 | [`/api/stripe/price`](#12-get-apistripeprice) | GET | ❌ | Get subscription price info |
| 13 | [`/api/stripe/webhook`](#13-post-apistripewebhook) | POST | 🔑† | Stripe webhook handler |
| 14 | [`/api/share/[debateId]`](#14-get-apisharedebateid) | GET | ❌ | Get share metadata for a debate |
| 15 | [`/api/embed/[debateId]`](#15-get-apiembeddebateid) | GET | ❌ | Embeddable HTML for a debate |
| 16 | [`/api/og`](#16-get-apiog) | GET | ❌ | Dynamic Open Graph image |
| 17 | [`/api/trending`](#17-get-apitrending) | GET | ❌ | Trending debate topics |
| 18 | [`/api/test-webhook`](#18-test-webhook-dev-only) | GET/POST | 🔒 | Dev-only test endpoint |

> \* Optional auth — returns `isOwner` flag when authenticated
>
> † Verified via Stripe webhook signature (`stripe-signature` header)

---

## Debate Endpoints

### 1. POST `/api/debate`

Send a user message in an active debate. Returns a **Server-Sent Events (SSE)** stream with the AI opponent's response.

**Auth:** Required (Clerk session)
**Rate Limit:** 60/min per IP · 20/min per user

#### Request Body

```json
{
  "debateId": "string (required) — UUID of the debate",
  "character": "string (required) — opponent type or 'custom'",
  "opponentStyle": "string (optional) — custom opponent style description",
  "topic": "string (required) — debate topic",
  "userArgument": "string (required) — the user's message",
  "previousMessages": [
    { "role": "user|ai", "content": "string" }
  ],
  "isAIAssisted": "boolean (optional) — flag for AI-assisted messages"
}
```

#### Response — SSE Stream

```
Content-Type: text/event-stream

data: {"type":"start"}
data: {"type":"search_start"}              // if web search triggered
data: {"type":"chunk","content":"..."}     // repeated
data: {"type":"citations","citations":[{"id":1,"url":"...","title":"..."}]}
data: {"type":"complete","content":"full text","debateId":"...","citations":[...]}
data: [DONE]
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Missing required fields"}` | Missing `character`, `topic`, or `userArgument` |
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 429 | `{"error":"message_limit_exceeded","message":"...","current":N,"limit":N,"upgrade_required":true}` | Free tier message limit reached |
| 429 | `{"error":"Too many requests. Please try again later."}` | Rate limit exceeded |
| 500 | `{"error":"Failed to generate debate response"}` | Server error |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled via kill switch |

---

### 2. POST `/api/debate/create`

Create a new debate session. Saves initial state to D1.

**Auth:** Required (Clerk session)
**Rate Limit:** 30/min per IP · 10/min per user

#### Request Body

```json
{
  "character": "string (optional) — opponent type, defaults to 'custom'",
  "opponentStyle": "string (optional) — custom style description",
  "topic": "string (required) — debate topic",
  "debateId": "string (required) — client-generated UUID"
}
```

#### Success Response — `200`

```json
{
  "success": true,
  "debateId": "uuid-string"
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Missing required fields"}` | Missing `topic` or `debateId` |
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 429 | `{"error":"Too many requests. Please try again later."}` | Rate limit exceeded |
| 500 | `{"error":"Failed to create debate"}` | Server error |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled |

---

### 3. POST `/api/debate/takeover`

AI generates an argument **on behalf of the user** (AI takeover / ghost-writing). Returns an SSE stream. Uses OpenAI-compatible API via Helicone gateway.

**Auth:** Required (Clerk session)
**Rate Limit:** 30/min per IP · 10/min per user

#### Request Body

```json
{
  "debateId": "string (required) — UUID of the debate",
  "topic": "string (required) — debate topic",
  "previousMessages": [
    { "role": "user|ai", "content": "string" }
  ],
  "opponentStyle": "string (optional) — opponent style for context"
}
```

#### Response — SSE Stream

```
Content-Type: text/event-stream

data: {"type":"search_start"}              // if web search triggered
data: {"type":"chunk","content":"..."}     // repeated
data: {"type":"citations","citations":[{"id":1,"url":"...","title":"..."}]}
data: [DONE]
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Missing required fields"}` | Missing `topic` or `debateId` |
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 429 | `{"error":"message_limit_exceeded",...}` | Free tier limit |
| 429 | `{"error":"Too many requests. Please try again later."}` | Rate limit exceeded |
| 500 | `{"error":"Failed to process AI takeover"}` | Server error |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled |

---

### 4. GET `/api/debate/[debateId]`

Fetch a single debate by ID. Public access — anyone with the debate ID can view it.

**Auth:** Optional (adds `isOwner` flag when present)
**Rate Limit:** None (consider adding)

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `debateId` | string | Debate UUID |

#### Success Response — `200`

```json
{
  "debate": {
    "id": "uuid-string",
    "opponent": "custom|elon-musk|...",
    "opponentStyle": "string|null",
    "topic": "string",
    "messages": [
      { "role": "user|ai|system", "content": "string", "aiAssisted": false, "citations": [] }
    ],
    "created_at": "ISO 8601",
    "score_data": { "userScore": 0, "aiScore": 0, "verdict": "...", "roastLevel": "..." }
  },
  "isOwner": true,
  "isAuthenticated": true
}
```

> Note: `user_id` is stripped from public response.

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Debate ID required"}` | Empty debateId |
| 404 | `{"error":"Debate not found"}` | No matching debate |
| 500 | `{"error":"Failed to retrieve debate"}` | Server error |

---

### 5. POST `/api/debate/[debateId]`

Post a message to a debate. **Legacy endpoint** — uses in-memory store with D1 fallback and generates AI response server-side (non-streaming). Prefer the main `POST /api/debate` endpoint.

**Auth:** Optional
**Rate Limit:** None

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `debateId` | string | Debate UUID |

#### Request Body

```json
{
  "message": "string (required) — user's message",
  "aiTakeover": "boolean (optional) — flag for AI-assisted"
}
```

#### Success Response — `200`

```json
{
  "success": true,
  "userMessage": {
    "role": "user",
    "content": "string",
    "aiAssisted": false,
    "created_at": "ISO 8601"
  },
  "aiMessage": {
    "role": "ai",
    "content": "string",
    "created_at": "ISO 8601"
  }
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Debate ID required"}` | Empty debateId |
| 400 | `{"error":"Message is required"}` | Missing or non-string message |
| 500 | `{"error":"Failed to send message"}` | Server error |

---

### 6. GET `/api/debates`

List the authenticated user's debate history, paginated.

**Auth:** Required (Clerk session)
**Rate Limit:** None (consider adding)

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 20 | Results per page |
| `offset` | integer | 0 | Pagination offset |

#### Success Response — `200`

```json
{
  "debates": [
    {
      "id": "uuid-string",
      "opponent": "custom|elon-musk|...",
      "opponentStyle": "string|null",
      "topic": "string",
      "messageCount": 12,
      "createdAt": "ISO 8601"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 500 | `{"error":"Failed to fetch debates"}` | Server error |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled |

---

## User & Subscription Endpoints

### 7. GET `/api/profile`

Get the current user's display name and avatar.

**Auth:** Required (Clerk `auth()`)
**Rate Limit:** None

#### Success Response — `200`

```json
{
  "displayName": "string|null",
  "avatarUrl": "string|null"
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 500 | `{"error":"Failed to get profile"}` | Server error |

---

### 8. POST `/api/profile`

Update the user's display name.

**Auth:** Required (Clerk `auth()`)
**Rate Limit:** None

#### Request Body

```json
{
  "displayName": "string (required, max 50 chars)"
}
```

#### Success Response — `200`

```json
{
  "success": true
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Invalid display name"}` | Missing or > 50 chars |
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 500 | `{"error":"Failed to update profile"}` | Server error |

---

### 9. GET `/api/subscription`

Get the current user's subscription/premium status.

**Auth:** Required (Clerk `auth()`)
**Rate Limit:** None

> **Dev mode:** Returns `isPremium: true` when `NODE_ENV=development` or `LOCAL_DEV_BYPASS=true`.

#### Success Response — `200`

```json
{
  "isPremium": true,
  "isSubscribed": true,
  "stripePlan": "premium|null",
  "subscriptionStatus": "active|canceled|past_due|null",
  "currentPeriodEnd": "ISO 8601|null",
  "cancelAtPeriodEnd": false
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 500 | `{"error":"Failed to fetch subscription"}` | Server error |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled |

---

## Stripe / Payment Endpoints

### 10. POST `/api/stripe/create-checkout`

Create a Stripe Checkout session for premium subscription.

**Auth:** Required (Clerk `auth()`)
**Rate Limit:** None (Stripe has its own)

#### Request Body

```json
{
  "returnUrl": "string (optional, default: '/debate') — redirect path after checkout"
}
```

#### Success Response — `200`

```json
{
  "url": "https://checkout.stripe.com/c/pay_..."
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"You already have an active subscription","hasSubscription":true}` | Already subscribed |
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 500 | `{"error":"Failed to create checkout session"}` | General error |
| 500 | `{"error":"Payment configuration error. Please contact support."}` | Invalid Stripe price ID |
| 500 | `{"error":"Payment service error. Please try again later."}` | Stripe API error |
| 503 | `{"error":"Unable to connect to payment service. Please try again later.","type":"connection"}` | Stripe connection failure |
| 503 | `{"error":"Service is temporarily disabled"}` | App disabled |

---

### 11. POST `/api/stripe/manage`

Create a Stripe Customer Portal session for managing subscriptions.

**Auth:** Required (Clerk `auth()`)
**Rate Limit:** None

#### Request Body

```json
{
  "returnUrl": "string (optional, default: '/history') — redirect path after portal"
}
```

#### Success Response — `200`

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"error":"Unauthorized"}` | No valid session |
| 404 | `{"error":"No subscription found"}` | No Stripe customer ID |
| 500 | `{"error":"Failed to create portal session"}` | Server error |

---

### 12. GET `/api/stripe/price`

Get the current subscription price. Returns cached data (1-hour TTL). Falls back to `$20.00/month` if Stripe is unavailable.

**Auth:** None
**Rate Limit:** None

#### Success Response — `200`

```json
{
  "amount": 2000,
  "currency": "usd",
  "formatted": "$20.00",
  "interval": "month",
  "isFallback": false
}
```

> When `isFallback: true`, the price is a static default (Stripe unavailable or unconfigured).

---

### 13. POST `/api/stripe/webhook`

Stripe webhook handler. Verified via `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`.

**Auth:** Stripe signature verification
**Rate Limit:** None (called by Stripe)

#### Handled Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates/updates user subscription in D1 |
| `customer.subscription.updated` | Updates subscription status, period end, cancel flag |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.payment_failed` | Marks subscription as past_due |

#### Success Response — `200`

```json
{
  "received": true
}
```

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"No signature"}` | Missing `stripe-signature` header |
| 400 | `{"error":"Invalid signature"}` | Signature verification failed |
| 500 | `{"error":"Webhook secret not configured"}` | Missing `STRIPE_WEBHOOK_SECRET` env var |
| 500 | `{"error":"Webhook handler failed"}` | Handler processing error |

---

## Public / SEO Endpoints

### 14. GET `/api/share/[debateId]`

Returns share-ready metadata for a debate: formatted text, platform-specific share URLs, OG image URL.

**Auth:** None
**Rate Limit:** 60/min per IP

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `debateId` | string | Debate UUID |

#### Success Response — `200`

```json
{
  "debateId": "uuid-string",
  "url": "https://debateai.org/debate/uuid-string",
  "ogImage": "https://debateai.org/api/og?debateId=uuid-string",
  "topic": "Is AI coming for your job?",
  "opponent": "Elon Musk",
  "messageCount": 8,
  "score": {
    "userScore": 7,
    "aiScore": 5,
    "roastLevel": "dominated",
    "verdict": "You won!"
  },
  "shareText": "I just won against Elon Musk on \"Is AI coming for your job?\" (7-5)! Can you do better?",
  "shareUrls": {
    "twitter": "https://twitter.com/intent/tweet?text=...",
    "facebook": "https://www.facebook.com/sharer/sharer.php?u=...",
    "linkedin": "https://www.linkedin.com/sharing/share-offsite/?url=...",
    "reddit": "https://reddit.com/submit?url=...&title=..."
  }
}
```

> `score` is `null` when the debate hasn't been scored yet.

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{"error":"Debate ID required"}` | Empty debateId |
| 404 | `{"error":"Debate not found"}` | No matching debate |
| 429 | `{"error":"Too many requests. Please try again later."}` | Rate limit exceeded |
| 500 | `{"error":"Failed to generate share data"}` | Server error |

---

### 15. GET `/api/embed/[debateId]`

Returns a self-contained HTML page for embedding debates in iframes. No external JS dependencies.

**Auth:** None
**Rate Limit:** 30/min per IP (via middleware)

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `debateId` | string | Debate UUID |

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `maxMessages` | integer | 10 | Max messages to display (capped at 50) |
| `theme` | `dark\|light` | `dark` | Color scheme |

#### Success Response — `200`

```
Content-Type: text/html; charset=utf-8
X-Frame-Options: ALLOWALL
Cache-Control: public, max-age=300, s-maxage=600
```

Returns complete HTML document with inline styles. Suitable for `<iframe>` embedding:

```html
<iframe src="https://debateai.org/api/embed/DEBATE_ID?theme=dark" width="600" height="400"></iframe>
```

#### Error Responses

| Status | Content-Type | When |
|--------|-------------|------|
| 400 | `text/html` | Empty debateId |
| 404 | `text/html` | Debate not found (styled error page) |
| 500 | `application/json` | Server error |

---

### 16. GET `/api/og`

Dynamic Open Graph image generation (1200×630px). Used as `og:image` in debate page meta tags.

**Auth:** None
**Rate Limit:** 20/min per IP
**Runtime:** Edge

#### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `debateId` | string (optional) | Debate UUID for score-specific image |

#### Response

```
Content-Type: image/png
```

- **Without `debateId`:** Generic DebateAI branding image (purple gradient, "Challenge AI Debaters")
- **With `debateId`:** Score card with verdict, user vs AI score, opponent name, topic. Gradient color based on `roastLevel` (red=destroyed, orange=roasted, yellow=held_own, green=dominated)

#### Error Responses

Returns a fallback branding image on any error (never returns JSON errors).

---

### 17. GET `/api/trending`

Fetch trending debate topics. Uses Brave Search API + Claude to generate debate questions from current news. Results cached for 1 hour.

**Auth:** None
**Rate Limit:** 10/min per IP

#### Success Response — `200`

```json
{
  "topics": [
    {
      "id": "ai-taking-jobs",
      "question": "Is AI actually coming for your job this year?",
      "context": "Tech layoffs continue while AI tools proliferate",
      "source": "Tech News",
      "category": "politics|tech|culture|business|science|sports",
      "heat": 3
    }
  ],
  "cached": true,
  "cacheAge": "23 minutes"
}
```

> When `fallback: true`, returns curated evergreen topics (news API or Claude unavailable).

#### Error Responses

| Status | Body | When |
|--------|------|------|
| 429 | `{"error":"Too many requests. Please try again later."}` | Rate limit exceeded |

> Non-429 errors return fallback topics instead of error status codes.

---

### 18. Test Webhook (Dev Only)

**`GET|POST /api/test-webhook`**

Development-only endpoint for testing webhook delivery. Returns `404` in production (`NODE_ENV !== 'development'`).

**Auth:** None (gated by `NODE_ENV`)
**Rate Limit:** None

#### Success Response — `200` (dev only)

```json
{
  "success": true,
  "message": "Test webhook received",
  "timestamp": "ISO 8601"
}
```

---

## Rate Limit Summary

| Endpoint | IP Limit | User Limit |
|----------|----------|------------|
| `POST /api/debate` | 60/min | 20/min |
| `POST /api/debate/create` | 30/min | 10/min |
| `POST /api/debate/takeover` | 30/min | 10/min |
| `GET /api/share/[debateId]` | 60/min | — |
| `GET /api/embed/[debateId]` | 30/min | — |
| `GET /api/og` | 20/min | — |
| `GET /api/trending` | 10/min | — |

Rate limiting is **in-memory, per-instance** (not distributed). Each Vercel serverless function instance maintains its own counters. This catches single-source abuse; distributed attacks would require external rate limiting (e.g., Vercel WAF, Cloudflare).

---

## Common Headers

### Rate Limit Headers (on rate-limited endpoints)

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1706889600
Retry-After: 30          (only on 429 responses)
```

### App Disabled Response

When the app kill switch is active, affected endpoints return:

```
Status: 503
{"error": "Service is temporarily disabled"}
```

Affected: `/api/debate`, `/api/debate/create`, `/api/debate/takeover`, `/api/debates`, `/api/subscription`

---

## Environment Variables

| Variable | Used By | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | `/api/debate`, `/api/trending` | Yes |
| `HELICONE_API_KEY` | `/api/debate`, `/api/debate/takeover` | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | All D1 queries | Yes |
| `CLOUDFLARE_D1_DATABASE_ID` | All D1 queries | Yes |
| `CLOUDFLARE_API_TOKEN` | All D1 queries | Yes |
| `CLOUDFLARE_EMAIL` | All D1 queries | Yes |
| `STRIPE_SECRET_KEY` | All Stripe endpoints | Yes |
| `STRIPE_PRICE_ID` | `/api/stripe/create-checkout`, `/api/stripe/price` | Yes |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` | Yes |
| `BRAVE_SEARCH_API_KEY` | `/api/trending` | Yes |
| `NEXT_PUBLIC_APP_URL` | `/api/share`, `/api/embed` | Defaults to `https://debateai.org` |
| `NEXT_PUBLIC_TEST_MODE` | `/api/debate`, `/api/debate/takeover` | No |
| `LOCAL_DEV_BYPASS` | `/api/debate`, `/api/debate/takeover`, `/api/subscription` | No |

---

## SSE (Server-Sent Events) Protocol

The debate and takeover endpoints use SSE for real-time streaming. Event types:

| Type | Data | Description |
|------|------|-------------|
| `start` | `{}` | Stream initialized |
| `search_start` | `{}` | AI is performing web search |
| `chunk` | `{"content":"..."}` | Text fragment (buffered, ~8 chars) |
| `citations` | `{"citations":[...]}` | Web search citations (up to 3) |
| `complete` | `{"content":"full text","debateId":"...","citations":[...]}` | Final complete message |
| `error` | `{"error":"..."}` | Stream error |
| `[DONE]` | — | End-of-stream signal |

### Client Example

```typescript
const response = await fetch('/api/debate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ debateId, character, topic, userArgument, previousMessages }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') return;
    const event = JSON.parse(data);
    // Handle event.type: 'chunk', 'citations', 'complete', etc.
  }
}
```
