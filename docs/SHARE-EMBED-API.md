# Share & Embed API

Public endpoints for sharing and embedding DebateAI debates. No authentication required.

---

## Share Metadata

```
GET /api/share/{debateId}
```

Returns share-ready metadata for a debate — use this to build share UIs or generate share links.

### Response

```json
{
  "debateId": "abc-123",
  "url": "https://debateai.org/debate/abc-123",
  "ogImage": "https://debateai.org/api/og?debateId=abc-123",
  "topic": "Should AI be regulated?",
  "opponent": "Elon Musk",
  "messageCount": 8,
  "score": {
    "userScore": 7,
    "aiScore": 5,
    "roastLevel": "held_own",
    "verdict": "Close match"
  },
  "shareText": "I just debated Elon Musk on \"Should AI be regulated?\" (7-5)! Can you do better?",
  "shareUrls": {
    "twitter": "https://twitter.com/intent/tweet?text=...",
    "facebook": "https://www.facebook.com/sharer/sharer.php?u=...",
    "linkedin": "https://www.linkedin.com/sharing/share-offsite/?url=...",
    "reddit": "https://reddit.com/submit?url=...&title=..."
  }
}
```

**Notes:**
- `score` is `null` if the debate hasn't been scored yet
- `shareText` adapts based on whether the user won, lost, or is still debating
- `shareUrls` are ready-to-use — just open them in a new window

### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "Debate ID required" }` | Missing debateId |
| 404 | `{ "error": "Debate not found" }` | Invalid debateId |
| 500 | `{ "error": "Failed to generate share data" }` | Server error |

---

## Embed (iframe)

```
GET /api/embed/{debateId}
```

Returns a self-contained HTML page for embedding a debate in an iframe. No external JS dependencies.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `dark` \| `light` | `dark` | Color scheme |
| `maxMessages` | number (1-50) | `10` | Max messages to display |

### Usage

```html
<iframe
  src="https://debateai.org/api/embed/abc-123?theme=dark&maxMessages=15"
  width="600"
  height="400"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #27272a;"
></iframe>
```

### Features
- Self-contained HTML — no external scripts or stylesheets
- Dark and light theme support
- Scrollable message area (max 400px height)
- "View full debate →" link to debateai.org
- Cached: 5min browser cache, 10min CDN cache
- `X-Frame-Options: ALLOWALL` for cross-origin embedding

### Error Responses
- 404: Returns a styled HTML error page (not JSON)
- 400/500: Returns plain text error

---

## OG Image

```
GET /api/og?debateId={debateId}
```

Generates a 1200×630 PNG image for social media previews. Used automatically by OG meta tags.

- Without `debateId`: Returns generic DebateAI branding image
- With `debateId`: Returns debate-specific image with score, verdict, and opponent

This endpoint is called by social platforms when a debate URL is shared — you typically don't need to call it directly.

---

## Integration Examples

### Share button (client-side, simple)
```ts
const shareUrl = `${window.location.origin}/debate/${debateId}`;
navigator.clipboard.writeText(shareUrl);
```

### Share button (with rich metadata)
```ts
const res = await fetch(`/api/share/${debateId}`);
const data = await res.json();
window.open(data.shareUrls.twitter, '_blank');
```

### Blog embed
```html
<iframe src="https://debateai.org/api/embed/abc-123?theme=light" width="100%" height="500"></iframe>
```
