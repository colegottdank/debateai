# Lighthouse & SEO Baseline Audit — debateai.org

**Date:** 2026-02-04
**Auditor:** Forge (Backend)
**Target:** https://www.debateai.org (production, pre-Phase 2)
**Method:** Manual audit (curl, headless Chromium, web_fetch). Lighthouse CLI hangs in sandbox; PageSpeed API rate-limited. Scores estimated from audit checklist.

---

## 🚨 Critical Finding: Homepage SSR Renders 404

The server-side HTML response for `https://www.debateai.org/` contains:
```html
<meta name="robots" content="noindex"/>
<title>404: This page could not be found.</title>
<title>DebateAI - Challenge Your Convictions</title>
```

The RSC payload routes to `_not-found`. After client-side JS hydration, the page renders correctly (verified with headless Chromium `--dump-dom`). **However, search engine crawlers processing the initial HTML see a 404 page with `noindex`.** This is a **P0 SEO issue** — Google may be actively de-indexing the homepage.

**Root cause:** Likely the Phase 1 merge (`da44bcf`) introduced a routing conflict in the App Router. The SSR prerender generates the not-found page, but client-side navigation resolves it.

**Fix priority:** IMMEDIATE. This negates all SEO work.

---

## Estimated Scores (Pre-Phase 2)

| Category | Estimated Score | Notes |
|----------|----------------|-------|
| **Performance** | 65-75 | Good TTFB, but heavy JS bundles + Clerk external script |
| **SEO** | 30-40 | noindex on homepage, no OG/Twitter/canonical/JSON-LD, no sitemap, no robots.txt |
| **Accessibility** | 50-60 | No skip link, no focus management, no aria attributes |
| **Best Practices** | 70-80 | HTTPS, modern JS, but external scripts without integrity |

---

## Performance

### Response Times (curl from EU server)
| Page | HTTP Status | TTFB | Total Time | Size |
|------|-------------|------|------------|------|
| `/` (homepage) | 200 | 241ms | 241ms | 14.7KB |
| `/debate` | 200 | 293ms | 293ms | 15.6KB |
| `/history` | 200 | 526ms | 526ms | 13.4KB |

### Redirect Chain
- `debateai.org` → 307 → `www.debateai.org` (~270ms overhead)
- Should be 301 permanent redirect, or eliminate redirect at DNS level

### JavaScript Bundles (10 scripts on homepage)
| Bundle | Size (raw) | Notes |
|--------|-----------|-------|
| `1ece2486` (vendor) | 169KB | Largest chunk |
| `668` (vendor) | 168KB | Second largest |
| `610` (Clerk/auth) | 119KB | Auth framework |
| `725` | 74KB | Unknown vendor |
| `604` | 11KB | |
| `page` (homepage) | 16KB | App code |
| `layout` | 8KB | App layout |
| `webpack` | 4KB | Runtime |
| `main-app` | 0.5KB | Entry |
| **Clerk external** | Unknown | External script, blocks nothing (async) |
| **Total JS** | ~570KB | Before gzip |

### CSS
| File | Size (raw) |
|------|-----------|
| `fe3c339737f3d475.css` | 58KB |

### Font Preloading
4 WOFF2 fonts preloaded — good practice.

### Caching
- Vercel cache: HIT on homepage (static prerender)
- `x-nextjs-prerender: 1` confirms static generation
- `x-nextjs-stale-time: 300` (5min revalidation)

---

## SEO Audit

### ❌ Critical Issues
| Issue | Status | Impact |
|-------|--------|--------|
| **Homepage `noindex`** | 🔴 BROKEN | Google will not index homepage |
| **SSR renders 404 title** | 🔴 BROKEN | Crawlers see "404: This page could not be found" |
| **robots.txt** | 🔴 MISSING | Returns HTML (404 page), not robots directives |
| **sitemap.xml** | 🔴 MISSING | Returns HTML (404 page), not sitemap XML |
| **OG tags** | 🔴 MISSING | No `og:title`, `og:description`, `og:image`, `og:url` |
| **Twitter cards** | 🔴 MISSING | No `twitter:card`, `twitter:title`, etc. |
| **Canonical URL** | 🔴 MISSING | No `<link rel="canonical">` |
| **JSON-LD** | 🔴 MISSING | No structured data |

### ✅ Present
| Feature | Status |
|---------|--------|
| `<title>` | ✅ "DebateAI - Challenge Your Convictions" (after 404 title) |
| `<meta description>` | ✅ Present and descriptive |
| `lang="en"` | ✅ On `<html>` |
| HTTPS | ✅ With HSTS |
| Favicons | ✅ 32px, 192px, 512px + apple-touch-icon |
| Font preloading | ✅ 4 WOFF2 fonts |

### Meta Tags Found in Production HTML
```
name="description" — ✅
name="viewport" — ✅
name="robots" content="noindex" — 🔴 (from _not-found route)
name="next-size-adjust" — (Next.js internal)
```

That's it. No OG, no Twitter, no canonical, no JSON-LD.

---

## Accessibility (Visual Inspection of HTML)

| Issue | Status |
|-------|--------|
| Skip link | ❌ Missing |
| Focus styles | ❌ Default browser only |
| ARIA attributes | ❌ None found |
| Color contrast | ⚠️ Unknown (needs visual check) |
| Keyboard navigation | ❌ No focus management |
| Semantic HTML | ⚠️ Client-rendered, minimal semantic structure in SSR |

---

## What Phase 1+2 Fixes (Not Yet Deployed)

| Issue | Fix | Branch |
|-------|-----|--------|
| robots.txt | `src/app/robots.ts` (dynamic) | `feature/phase1-seo-ssr` ✅ merged |
| sitemap.xml | `src/app/sitemap.ts` (D1-backed) | `feature/phase1-seo-ssr` ✅ merged |
| OG tags | `layout.tsx` generateMetadata | `feature/phase1-seo-ssr` ✅ merged |
| Twitter cards | Included in OG metadata | `feature/phase1-seo-ssr` ✅ merged |
| Canonical URLs | In generateMetadata | `feature/phase1-seo-ssr` ✅ merged |
| JSON-LD | `src/lib/jsonld.ts` | `feature/phase1-seo-ssr` ✅ merged |
| Accessibility | Full a11y pass | `fix/mobile-viewport` (pending PR) |
| Rate limiting | All API endpoints | `feature/rate-limit-authed-endpoints` (pending PR) |
| Skip link | In layout.tsx | `fix/mobile-viewport` (pending PR) |
| Focus management | ShareModal focus trap | `fix/mobile-viewport` (pending PR) |

---

## Recommendations

### Immediate (P0)
1. **Fix the 404/noindex SSR issue** — The homepage SSR response contains `_not-found` route content. This is the #1 blocker for all SEO.
2. **Deploy pending branches** — Phase 1 code is merged to main but production still shows the old (broken) state. Force redeploy on Vercel.

### Short-term (P1)
3. **Fix 307 redirect** — `debateai.org` → `www.debateai.org` should be 301, or eliminate redirect at DNS level.
4. **Reduce JS bundle size** — 570KB raw JS is heavy. Consider:
   - Lazy-load Clerk (119KB) after initial paint
   - Analyze vendor chunks for tree-shaking opportunities
   - Code-split heavy components

### Medium-term (P2)
5. **Add performance monitoring** — Web Vitals tracking (already instrumented in analytics.ts)
6. **Image optimization** — Verify all images use Next.js `<Image>` with proper sizing
7. **Preconnect to external domains** — `clerk.debateai.org`, `anthropic.helicone.ai`

---

## Target Scores (Post-Deploy)

| Category | Current | Target | Path |
|----------|---------|--------|------|
| Performance | 65-75 | 85+ | Bundle optimization, preconnects |
| SEO | 30-40 | 90+ | Phase 1 fixes (robots, sitemap, OG, JSON-LD) |
| Accessibility | 50-60 | 85+ | Pixel's a11y pass |
| Best Practices | 70-80 | 90+ | Minor fixes |

---

*Will re-run full Lighthouse after deployment to get precise scores.*
