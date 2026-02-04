# Production Audit — 2026-02-04

> **Deploy:** `64a79ae` on `main`
> **Build ID:** `N7_FsmsM6fggbKeGdjO3Y`
> **Audited:** 2026-02-04 19:06 UTC

---

## Route Health

| Route | Status | TTFB | Size |
|-------|--------|------|------|
| `/` (homepage) | ✅ 200 | 181ms | 23.3KB |
| `/robots.txt` | ✅ 200 | 135ms | 120B |
| `/sitemap.xml` | ✅ 200 | 146ms | 211KB (1,114 URLs) |
| `/api/og` | ✅ 200 | 138ms | 151KB (PNG) |
| `/blog` | ✅ 200 | 170ms | 24.3KB |
| `/blog/how-we-built-realtime-ai-debates` | ✅ 200 | 128ms | 62.3KB |
| `/nonexistent` (404) | ✅ 404 | 155ms | 20.7KB |
| `debateai.org` → `www.debateai.org` | ⚠️ 307 | 113ms | Redirect (should be 301) |

**All TTFBs under 200ms.** Excellent.

---

## SEO Verification

### Meta Tags ✅
- **Title:** `DebateAI — Challenge Your Convictions`
- **Description:** `Challenge your beliefs against AI trained to argue from every perspective...`
- **Canonical:** `https://debateai.org`
- **Viewport:** `width=device-width, initial-scale=1`
- **Lang:** `en`
- **No `noindex`:** ✅ Confirmed

### Open Graph ✅
- `og:title` — DebateAI — Challenge Your Convictions
- `og:description` — Challenge your beliefs...
- `og:url` — https://debateai.org
- `og:site_name` — DebateAI
- `og:image` — https://debateai.org/api/og (1200×630, PNG)
- `og:type` — website

### Twitter Cards ✅
- `twitter:card` — summary_large_image
- `twitter:title` — DebateAI — Challenge Your Convictions
- `twitter:description` — Challenge your beliefs...
- `twitter:image` — https://debateai.org/api/og

### JSON-LD ✅
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "DebateAI",
  "url": "https://debateai.org",
  "description": "Challenge your beliefs against AI...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://debateai.org/debate"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### robots.txt ✅
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /sign-in
Disallow: /sign-up

Sitemap: https://debateai.org/sitemap.xml
```

### sitemap.xml ✅
- **1,114 URLs** indexed (homepage, /debate, /blog, blog posts, all debate pages)
- Includes `lastmod`, `changefreq`, `priority` for all entries
- Blog post URLs present (e.g., `/blog/how-we-built-realtime-ai-debates`)

### Blog Post SEO ✅
- Title: `How We Built Real-Time AI Debates with Claude | DebateAI`
- Description: `A deep dive into the architecture behind DebateAI...`
- OG tags: Present and correct

---

## Accessibility

| Check | Status |
|-------|--------|
| Skip link (`#main-content`) | ✅ Present |
| Main landmark | ✅ `id="main-content"` |
| `lang="en"` on `<html>` | ✅ |
| Theme color (dark/light) | ✅ Both set |
| Favicons (32, 192, 512) | ✅ All present |
| `aria-live` region | ✅ Toast container |

---

## Performance

### Client Bundle (Homepage)

| Chunk | Raw | Gzipped | Purpose |
|-------|-----|---------|---------|
| `1ece2486` | 173KB | 54.9KB | React runtime |
| `668` | 172KB | 46.6KB | Clerk SDK |
| `610` | 122KB | 34.6KB | Shared vendor |
| `polyfills` | 113KB | 39.8KB | Polyfills |
| `564` | 67KB | 20.4KB | App shared |
| `page` | 18KB | 5.8KB | Homepage component |
| `604` | 13KB | 4.1KB | Homepage deps |
| `layout` | 11KB | 4.1KB | Root layout |
| `366` | 9KB | 3.4KB | Common utilities |
| `webpack` | 4KB | 2.0KB | Webpack runtime |
| `main-app` | 0.6KB | 0.6KB | App entry |
| `not-found` | 0.2KB | 0.2KB | 404 (preloaded) |
| **CSS** | **68KB** | **11.5KB** | Tailwind styles |
| **Total JS** | **702KB** | **216KB** | |

### Key Metrics
- **Total JS (gzipped):** ~216KB
- **Total CSS (gzipped):** ~11.5KB
- **TTFB (homepage):** 181ms
- **TTFB (blog post):** 128ms
- **Document size:** 23.3KB

### Estimated Lighthouse Scores (based on manual audit)
| Category | Estimate | Reasoning |
|----------|----------|-----------|
| **Performance** | 70-80 | Good TTFB, but 216KB gzipped JS is heavy. Clerk SDK alone is ~47KB gzip. |
| **SEO** | 90-95 | All meta tags, JSON-LD, sitemap, robots.txt, canonical present. Minor: 307 redirect instead of 301. |
| **Accessibility** | 65-75 | Skip link, landmarks, lang present. Need browser audit for color contrast, focus order, ARIA. |
| **Best Practices** | 80-90 | HTTPS, HSTS, no mixed content. Minor: no explicit CORS headers. |

---

## Issues Found

### ⚠️ 307 Redirect (Non-www → www)
`debateai.org` → `www.debateai.org` uses 307 (Temporary). Should be 301 (Permanent) for SEO credit. This is a Vercel/DNS config issue, not code.

### ⚠️ Polyfills Bundle (113KB / 40KB gzip)
`polyfills-42372ed130431b0a.js` is 40KB gzipped — loaded for all users. Modern browsers don't need most of these. Next.js loads this with `noModule` so modern browsers skip it, but worth verifying.

### ⚠️ Clerk SDK Size (172KB / 47KB gzip)
Clerk's client SDK is the single largest chunk. This is inherent to using Clerk — no easy fix without switching auth providers.

---

## Comparison: Before vs After Phase 1

| Metric | Before (pre-Phase 1) | After (Phase 1 live) |
|--------|----------------------|----------------------|
| robots.txt | ❌ 404 | ✅ 200, proper rules |
| sitemap.xml | ❌ 404 | ✅ 200, 1,114 URLs |
| OG tags | ❌ None | ✅ Full OG + Twitter |
| JSON-LD | ❌ None | ✅ WebSite schema |
| Canonical | ❌ None | ✅ Present |
| noindex | ⚠️ Transient noindex | ✅ None |
| Blog | ❌ Didn't exist | ✅ Live with 1 post |
| 404 page | ❌ Default | ✅ Custom branded |
| Homepage TTFB | ~300ms | 181ms |
| Debate SSR | ❌ Client-only | ✅ Server-rendered |
