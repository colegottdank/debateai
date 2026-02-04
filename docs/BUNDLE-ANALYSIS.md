# Client Bundle Analysis

> **Date:** 2026-02-04
> **Method:** Manual code audit (sandbox OOM prevents `next build`)
> **Scope:** All `'use client'` components, their import trees, and third-party deps

---

## Summary

| Metric | Value |
|--------|-------|
| Client components | 14 files |
| Client-pulled lib files | 6 files |
| Total client source (pre-minify) | **~159 KB** |
| Third-party client deps | Clerk (~80KB gzip est.), stripe-js (unused), aws-sdk (unused) |
| Dynamic imports / code-splitting | **Zero** |
| Lazy-loaded modals | **None** (all static imports) |

**Headline finding:** No code-splitting at all. Every modal, every data file, and a 34KB mega-component ship eagerly on first load.

---

## 🔴 Critical Findings

### 1. `topics.ts` + `personas.ts` shipped to every homepage visitor (~30KB)

**Impact:** High — affects homepage LCP

```
src/lib/topics.ts       14.5KB  ← 246 lines of static topic data
src/lib/personas.ts     14.7KB  ← 173 lines of persona definitions
src/lib/daily-debates.ts 9.5KB  ← imports both above
```

**How it happens:** `src/app/page.tsx` (client component) imports `getDailyDebate()` → pulls in all topics + personas. The function only picks ONE daily debate but ships the entire catalog to the browser.

**Fix:** Move `getDailyDebate()` to a server component or API route. The homepage only needs one `{ persona, topic, description }` object — not the full 30KB catalog.

**Estimated savings:** ~25-30KB (pre-minify), ~8-12KB gzipped

---

### 2. `DebateClient.tsx` is a 34KB monolith

**Impact:** High — loaded on every debate page

```
src/app/debate/[debateId]/DebateClient.tsx  33.3KB / 822 lines
```

This single component handles:
- SSE streaming + message parsing
- Citation rendering
- Score display + animations
- Share UI
- Upgrade prompts
- Message input + AI takeover
- Debate state management

**Fix:** Extract into sub-components. At minimum:
- `DebateMessages.tsx` — message list + citation rendering
- `DebateInput.tsx` — input bar + takeover button
- `DebateScore.tsx` — score display + animations
- Keep `DebateClient.tsx` as orchestrator

This won't reduce bundle size directly (same code, split files) but enables future lazy-loading of score/share UI that's below the fold.

---

### 3. Zero dynamic imports — modals ship eagerly

**Impact:** Medium — adds ~20KB to every page

```
UpgradeModal.tsx   7.7KB  ← imported on 5 pages/components
ShareModal.tsx    11.4KB  ← imported on DebateClient
ShareButtons.tsx   3.7KB  ← imported on DebateClient
```

**How it happens:** All modals use static `import` — they're in the bundle even when the user never opens them. `UpgradeModal` is imported in **every page** (homepage, debate, history) plus Header.

**Fix:** Use `next/dynamic` with `ssr: false`:

```tsx
import dynamic from 'next/dynamic';
const UpgradeModal = dynamic(() => import('@/components/UpgradeModal'), { ssr: false });
const ShareModal = dynamic(() => import('@/components/ShareModal'), { ssr: false });
```

**Estimated savings:** ~20KB deferred from initial load per page

---

### 4. Homepage, History, and Debate Setup are fully client-rendered

**Impact:** Medium — SEO + performance

```
src/app/page.tsx         13.7KB  'use client' — entire homepage
src/app/history/page.tsx 14.2KB  'use client' — entire history page
src/app/debate/page.tsx  10.1KB  'use client' — debate setup page
```

These are top-level page components marked `'use client'`. This means:
- Zero server-side HTML for crawlers (except debate/[debateId] which was already fixed)
- Full React hydration cost on every visit
- No streaming SSR benefits

**Fix (homepage):** Split into server component (renders static hero, daily debate from server) + client component (handles form input, auth checks). This is the same pattern we used for `debate/[debateId]`.

**Fix (history):** Fetch initial debates server-side, pass to client for interactivity.

**Fix (debate setup):** The form is inherently interactive — keep client, but the page shell (header, static text) can be server-rendered.

**Estimated savings:** 15-25KB less JS hydrated on initial load per page + better LCP

---

## 🟡 Medium Findings

### 5. `useDebate.ts` is dead code (8.3KB)

```
src/lib/useDebate.ts  8.3KB / 228 lines
```

Exported `useDebate()` hook — **never imported anywhere**. It was likely replaced by inline state management in `DebateClient.tsx`.

**Fix:** Delete it. Tree-shaking should handle this, but explicit removal is cleaner.

**Savings:** 8.3KB removed from source

---

### 6. `ArtisticBackground` in root layout — loads on every page

```
src/app/layout.tsx:6:  import ArtisticBackground from '@/components/backgrounds/ArtisticBackground';
src/app/layout.tsx:98: <ArtisticBackground />
```

1.7KB component with mouse-tracking event listener, runs on every page including blog posts where it's not needed.

**Fix:** Lazy-load with `next/dynamic` + only render on app pages (not blog):

```tsx
const ArtisticBackground = dynamic(
  () => import('@/components/backgrounds/ArtisticBackground'),
  { ssr: false }
);
```

---

### 7. `@clerk/nextjs` imported on every client page

Every page/component that needs auth imports from `@clerk/nextjs`:
- `useUser` — 4 files
- `useClerk` — 3 files  
- `SignInButton` / `SignedIn` / `SignedOut` / `UserButton` — Header, UpgradeModal

Clerk's client bundle is estimated at **~80KB gzipped**. This is unavoidable for auth features, but the impact is amplified by having 3 full-page client components that each import it independently.

**Fix:** Converting pages to server/client split (Finding #4) would let the server component handle auth checks via `auth()` (server-side, zero client JS), reducing the number of components that need Clerk's client SDK.

---

### 8. Unused dependencies in `package.json`

| Package | Size (node_modules) | Used? |
|---------|-------------------|-------|
| `@aws-sdk/client-s3` | 16MB | ❌ Never imported |
| `@aws-sdk/s3-request-presigner` | (included above) | ❌ Never imported |
| `@stripe/stripe-js` | 2.6MB | ❌ Never imported (server uses `stripe` not `@stripe/stripe-js`) |
| `@anthropic-ai/claude-code` | 139MB | ❌ Dev tool, not app code |
| `yarn` | — | ❌ Listed as dependency (should be global) |

These don't affect client bundle (tree-shaking + server-only), but they:
- Bloat `node_modules` by **~160MB**
- Slow down `npm install` / CI
- Increase cold start in serverless (potentially)

**Fix:** Remove from `package.json`:
```bash
npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @stripe/stripe-js @anthropic-ai/claude-code yarn
```

---

## 🟢 Good Patterns Already in Place

- ✅ `debate/[debateId]/page.tsx` is a server component (SSR) — client split done correctly
- ✅ `AnalyticsPageView` is lightweight (1KB) and properly client-only
- ✅ `ThemeProvider` / `ThemeToggle` are small and correctly client-only
- ✅ `Toast` uses context — single instance, not duplicated
- ✅ API routes correctly don't import client code
- ✅ Blog pages are server-rendered (no `'use client'`)
- ✅ Heavy server-only deps (Anthropic SDK, OpenAI, Stripe server) stay server-side

---

## Recommended Priority Order

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| **P0** | Lazy-load `UpgradeModal` + `ShareModal` with `next/dynamic` | 30min | -20KB initial load |
| **P0** | Move `getDailyDebate()` to server / API | 1hr | -25KB homepage bundle |
| **P1** | Delete `useDebate.ts` (dead code) | 5min | -8KB source cleanup |
| **P1** | Remove unused deps from `package.json` | 10min | -160MB node_modules, faster CI |
| **P1** | Server/client split for homepage (`page.tsx`) | 2hr | Better LCP, SEO, -15KB JS |
| **P2** | Server/client split for history page | 2hr | Better LCP, SEO |
| **P2** | Split `DebateClient.tsx` into sub-components | 3hr | Maintainability, future lazy-loading |
| **P2** | Lazy-load `ArtisticBackground` | 15min | Slightly faster blog pages |
| **P3** | Server/client split for debate setup page | 1hr | Minor improvement |

---

## Estimated Total Impact

If all P0+P1 fixes are applied:

| Metric | Before | After (est.) |
|--------|--------|-------------|
| Homepage JS (pre-gzip) | ~115KB | ~70KB |
| Debate page JS (pre-gzip) | ~95KB | ~75KB |
| `node_modules` size | ~450MB | ~290MB |
| Pages with full SSR | 1 (debate/[id]) | 3+ (homepage, history, debate/[id]) |

> Note: These are source-level estimates. Actual gzipped bundle sizes require a production build. Minification typically achieves 60-70% reduction, gzip another 60-70% on top.

---

## How to Verify (Post-Deploy)

Once production is live:

```bash
# Bundle analyzer
ANALYZE=true next build

# Or check built output
ls -la .next/static/chunks/ | sort -k5 -rn | head -20

# Lighthouse performance audit
npx lighthouse https://debateai.org --only-categories=performance --output=json
```
