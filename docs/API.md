# DebateAI API Reference

All endpoints are prefixed with `/api/`. Base URL: `https://debateai.org`

---

## Authentication

Protected endpoints require a valid Clerk session. Requests without auth receive `401 Unauthorized`.

Public endpoints are marked with 🌐. All others require authentication.

## Error Format

All errors return JSON:
```json
{ "error": "Human-readable error message" }
```

Rate-limited responses (429) include headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707000000
Retry-After: 45
```

---

## Debate Endpoints

### POST `/api/debate`
Send a message in a debate. Streams Claude's response via SSE.

| Field | Value |
|-------|-------|
| Auth | Required |
| Rate Limit | 20/min per user, 60/min per IP |
| Content-Type | `application/json` |
| Response | `text/event-stream` |

**Request Body:**
```json
{
  "debateId": "uuid",
  "character": "custom",
  "opponentStyle": "Devil's Advocate",
  "topic": "Should AI be regulated?",
  "userArgument": "I believe AI needs oversight because...",
  "previousMessages": [
    { "role": "user", "content": "..." },
    { "role": "ai", "content": "..." }
  ],
  "isAIAssisted": false
}
```

**SSE Events:**
```
data: {"type":"start"}
data: {"type":"search_start"}
data: {"type":"chunk","content":"I "}
data: {"type":"chunk","content":"disagree"}
data: {"type":"citations","citations":[{"id":1,"url":"...","title":"..."}]}
data: {"type":"complete","content":"Full response...","debateId":"uuid","citations":[...]}
data: [DONE]
```

**Errors:** `400` missing fields, `401` unauthorized, `429` rate/message limit

---

### POST `/api/debate/create`
Create a new debate.

| Field | Value |
|-------|-------|
| Auth | Required |
| Rate Limit | 10/min per user, 30/min per IP |

**Request Body:**
```json
{
  "character": "custom",
  "opponentStyle": "Devil's Advocate",
  "topic": "Should AI be regulated?",
  "debateId": "client-generated-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "debateId": "uuid"
}
```

**Errors:** `400` missing fields, `401` unauthorized, `429` rate limited

---

### GET `/api/debate/[debateId]`
Fetch a debate and its messages.

| Field | Value |
|-------|-------|
| Auth | Optional (public for sharing) |
| Rate Limit | None (Clerk middleware handles abuse) |

**Response (200):**
```json
{
  "debate": {
    "id": "uuid",
    "opponent": "custom",
    "opponentStyle": "Devil's Advocate",
    "topic": "Should AI be regulated?",
    "messages": [...],
    "score_data": { ... },
    "created_at": "2026-01-01T00:00:00Z"
  },
  "isOwner": true,
  "isAuthenticated": true
}
```

> Note: `user_id` is stripped from the response for privacy.

**Errors:** `400` missing ID, `404` not found

---

### POST `/api/debate/[debateId]`
Add a message to a debate (legacy/fallback endpoint).

| Field | Value |
|-------|-------|
| Auth | Optional |

**Request Body:**
```json
{
  "message": "My argument...",
  "aiTakeover": false
}
```

**Response (200):**
```json
{
  "success": true,
  "userMessage": { "role": "user", "content": "..." },
  "aiMessage": { "role": "ai", "content": "..." }
}
```

---

### POST `/api/debate/takeover`
Let AI generate an argument on the user's behalf.

| Field | Value |
|-------|-------|
| Auth | Required |
| Rate Limit | 10/min per user, 30/min per IP |
| Response | `text/event-stream` |

**Request Body:**
```json
{
  "debateId": "uuid",
  "topic": "Should AI be regulated?",
  "previousMessages": [...],
  "opponentStyle": "Devil's Advocate"
}
```

**SSE Events:** Same format as `POST /api/debate`

---

### GET `/api/debates`
List the authenticated user's debates (paginated).

| Field | Value |
|-------|-------|
| Auth | Required |

**Query Params:**
| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 20 | Max results |
| `offset` | 0 | Pagination offset |

**Response (200):**
```json
{
  "debates": [
    {
      "id": "uuid",
      "opponent": "custom",
      "opponentStyle": "Devil's Advocate",
      "topic": "Should AI be regulated?",
      "messageCount": 12,
      "createdAt": "2026-01-01T00:00:00Z"
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

---

## Public Endpoints 🌐

### GET `/api/share/[debateId]` 🌐
Share metadata for a debate.

| Field | Value |
|-------|-------|
| Auth | None |
| Rate Limit | 60/min per IP |

**Response (200):**
```json
{
  "debateId": "uuid",
  "url": "https://debateai.org/debate/uuid",
  "ogImage": "https://debateai.org/api/og?debateId=uuid",
  "topic": "Should AI be regulated?",
  "opponent": "Devil's Advocate",
  "messageCount": 12,
  "score": {
    "userScore": 7,
    "aiScore": 5,
    "roastLevel": "dominated",
    "verdict": "You won convincingly"
  },
  "shareText": "I just won against Devil's Advocate on \"Should AI be regulated?\" (7-5)!",
  "shareUrls": {
    "twitter": "https://twitter.com/intent/tweet?...",
    "facebook": "https://www.facebook.com/sharer/...",
    "linkedin": "https://www.linkedin.com/sharing/...",
    "reddit": "https://reddit.com/submit?..."
  }
}
```

---

### GET `/api/embed/[debateId]` 🌐
Embeddable HTML for iframes.

| Field | Value |
|-------|-------|
| Auth | None |
| Rate Limit | 30/min per IP |
| Response | `text/html` |

**Query Params:**
| Param | Default | Description |
|-------|---------|-------------|
| `maxMessages` | 10 | Max messages shown (max 50) |
| `theme` | `dark` | `dark` or `light` |

**Usage:**
```html
<iframe src="https://debateai.org/api/embed/DEBATE_ID?theme=dark" 
        width="600" height="400"></iframe>
```

---

### GET `/api/og` 🌐
Dynamic OG image generation (Edge runtime).

| Field | Value |
|-------|-------|
| Auth | None |
| Rate Limit | 20/min per IP |
| Runtime | Edge |
| Response | `image/png` |

**Query Params:**
| Param | Description |
|-------|-------------|
| `debateId` | Optional — generates debate-specific image with score |

---

### GET `/api/trending` 🌐
AI-generated trending debate topics (cached 1 hour).

| Field | Value |
|-------|-------|
| Auth | None |
| Rate Limit | 10/min per IP |

**Response (200):**
```json
{
  "topics": [
    {
      "id": "uuid",
      "question": "Should AI replace teachers?",
      "context": "Recent advances in AI tutoring...",
      "source": "Education Week",
      "category": "tech",
      "heat": 3
    }
  ],
  "cached": true,
  "cacheAge": "23 minutes"
}
```

---

## Payment Endpoints

### POST `/api/stripe/create-checkout`
Create a Stripe Checkout session for premium upgrade.

| Field | Value |
|-------|-------|
| Auth | Required |

**Request Body:**
```json
{
  "returnUrl": "/debate"
}
```

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Errors:** `400` already subscribed, `401` unauthorized, `503` Stripe connection error

---

### POST `/api/stripe/manage`
Create a Stripe Customer Portal session.

| Field | Value |
|-------|-------|
| Auth | Required |

**Request Body:**
```json
{
  "returnUrl": "/history"
}
```

**Response (200):**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### GET `/api/stripe/price`
Fetch current subscription price (cached 1 hour).

| Field | Value |
|-------|-------|
| Auth | None |

**Response (200):**
```json
{
  "amount": 2000,
  "currency": "usd",
  "formatted": "$20.00",
  "interval": "month",
  "isFallback": false
}
```

---

### POST `/api/stripe/webhook`
Stripe webhook handler. Validates signature.

| Field | Value |
|-------|-------|
| Auth | Stripe signature |

**Events handled:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## User Endpoints

### GET `/api/subscription`
Check current user's subscription status.

| Field | Value |
|-------|-------|
| Auth | Required |

**Response (200):**
```json
{
  "isPremium": true,
  "isSubscribed": true,
  "stripePlan": "premium",
  "subscriptionStatus": "active",
  "debatesUsed": 5,
  "debatesLimit": null,
  "currentPeriodEnd": "2026-03-01T00:00:00Z"
}
```

---

### GET `/api/profile`
Get user's display name and avatar.

| Field | Value |
|-------|-------|
| Auth | Required |

**Response (200):**
```json
{
  "displayName": "DebateChamp",
  "avatarUrl": "https://..."
}
```

---

### POST `/api/profile`
Update user's display name.

| Field | Value |
|-------|-------|
| Auth | Required |

**Request Body:**
```json
{
  "displayName": "NewName"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid fields) |
| 401 | Unauthorized (no valid session) |
| 404 | Not found |
| 429 | Rate limited or message limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (Stripe connection) |
