# Lighthouse Baseline Audit — debateai.org

**Date:** 2026-02-04
**Auditor:** Forge (Backend)
**Method:** Manual SEO signal audit via curl (Lighthouse CLI too heavy for sandbox; PageSpeed API rate-limited)
**Note:** Phase 1 branch (`feature/phase1-seo-ssr`) is NOT yet merged to production. This audit captures the **pre-merge baseline**.

---

## Current Production State (Pre-Merge)

### Performance
| Metric | Value | Status |
|--------|-------|--------|
| TTFB | ~267ms (before redirect) | ✅ Good |
| Total load (with redirect) | ~557ms | ✅ Good |
| Page size (homepage) | 14.7 KB HTML | ✅ Good |
| Redirect | 307 debateai.org → www.debateai.org | ⚠️ Extra hop |

### SEO Signals
| Signal | Status | Notes |
|--------|--------|-------|
| `<title>` | ✅ Present | "DebateAI - Challenge Your Convictions" |
| `<meta description>` | ✅ Present | Good, keyword-rich |
| `robots.txt` | ❌ Missing | Returns 404 (renders as HTML page) |
| `sitemap.xml` | ❌ Missing | Returns 404 (renders as HTML page) |
| OG tags | ❌ Missing | No `og:title`, `og:description`, `og:image` |
| Twitter cards | ❌ Missing | No `twitter:card`, `twitter:title` |
| JSON-LD | ❌ Missing | No structured data |
| Canonical URL | ❌ Missing | No `<link rel="canonical">` |
| `lang` attribute | ✅ Present | `<html lang="en">` |
| Viewport meta | ✅ Present | Correct |
| HTTPS | ✅ Yes | Via Vercel |
| Font preloading | ✅ Yes | 4 font files preloaded |

### Estimated Lighthouse Scores (Pre-Merge)
Based on manual audit signals:
| Category | Estimated Score | Reasoning |
|----------|----------------|-----------|
| Performance | ~75-85 | Good TTFB, small page, but client-side rendering + redirect penalty |
| SEO | ~50-60 | ❌ No robots.txt, sitemap, OG tags, canonical, JSON-LD |
| Accessibility | ~70-80 | Needs full audit, but basic structure present |
| Best Practices | ~80-85 | HTTPS, proper meta viewport |

---

## Post-Merge Expected Improvements

### What `feature/phase1-seo-ssr` adds:
| Signal | Before | After |
|--------|--------|-------|
| robots.txt | ❌ 404 | ✅ Dynamic, blocks /api/ |
| sitemap.xml | ❌ 404 | ✅ Dynamic, all debates + blog |
| OG tags | ❌ None | ✅ Per-page (title, desc, image) |
| Twitter cards | ❌ None | ✅ summary_large_image per page |
| JSON-LD | ❌ None | ✅ WebSite + Article + DiscussionForumPosting |
| Canonical URLs | ❌ None | ✅ On all pages |
| SSR debate content | ❌ Client-only | ✅ Server-rendered semantic HTML |
| metadataBase | ❌ None | ✅ Set for relative URL resolution |

### Expected Post-Merge Scores:
| Category | Current | Expected | Target |
|----------|---------|----------|--------|
| Performance | ~75-85 | ~80-90 | 90+ |
| SEO | ~50-60 | **~90-95** | 90+ |
| Accessibility | ~70-80 | ~75-85 | 80+ |
| Best Practices | ~80-85 | ~85-90 | 85+ |

---

## Fix Plan (Items Below 80 Target)

### 1. SEO (Currently ~50-60 → Fix: Merge Phase 1)
- **Root cause:** Missing robots.txt, sitemap, OG tags, canonical, structured data
- **Fix:** Merge `feature/phase1-seo-ssr` — addresses ALL issues
- **Priority:** P0 — this is the entire Phase 1 goal

### 2. Performance (Currently ~75-85)
- **Redirect penalty:** 307 debateai.org → www.debateai.org adds ~270ms
  - **Fix:** Configure Vercel to use `www.debateai.org` as primary, or redirect at DNS level
- **Client-side rendering:** Homepage is fully client-rendered
  - **Fix:** Consider SSR for landing page (lower priority than debate pages)
- **Clerk JS bundle:** External script loaded from clerk.debateai.org
  - **Fix:** Evaluate lazy loading Clerk after initial paint

### 3. Accessibility (Needs Full Audit)
- Run axe-core audit post-merge for detailed findings
- Likely issues: color contrast, ARIA labels, focus management
- **Fix:** Create ticket for Pixel after baseline

---

## Next Steps
1. **Merge Phase 1 branch** — fixes all SEO signals
2. **Re-run audit post-merge** — get real Lighthouse numbers
3. **Address redirect penalty** — configure primary domain
4. **Accessibility audit** — detailed axe-core run
