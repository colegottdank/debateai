# Security & Error Handling Audit

**Date:** 2026-02-04  
**Auditor:** Forge (Backend)  
**Scope:** All API routes in `src/app/api/`

---

## 🔴 Security Issues (Fix Required)

### 1. Webhook Secret Partial Leak in Logs
**File:** `src/app/api/stripe/webhook/route.ts:25`
```typescript
console.log('🔑 Secret starts with:', webhookSecret?.substring(0, 10));
```
**Risk:** Leaks first 10 chars of Stripe webhook secret to Vercel logs. Anyone with log access can see partial secret.  
**Fix:** Remove this line. Log only `!!webhookSecret` (already done on line 24).  
**Severity:** Medium

### 2. Test Webhook Endpoint in Production
**File:** `src/app/api/test-webhook/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const body = await request.text();
  // ... logs and returns success
}
```
**Risk:** Unauthenticated POST endpoint that accepts any body and returns success. Could be used for SSRF reconnaissance or as an amplification vector.  
**Fix:** Either remove entirely or gate behind `NODE_ENV === 'development'`.  
**Severity:** Low-Medium

### 3. Error Messages Leak Internal Details
**File:** `src/app/api/stripe/create-checkout/route.ts` (bottom catch block)
```typescript
return NextResponse.json({
  error: error.message || 'Failed to create checkout session',
  type: error.type || 'unknown',
  code: error.code,
  details: error.message
});
```
**Risk:** Stripe error messages and error codes exposed to client. Could reveal internal API configuration.  
**Fix:** Return generic error to client, log details server-side only.  
**Severity:** Low-Medium

**File:** `src/app/api/stripe/manage/route.ts`
```typescript
{ error: error.message || 'Failed to create portal session' }
```
Same issue — raw error.message sent to client.

**File:** `src/app/api/debate/[debateId]/route.ts:140`
```typescript
{ error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' }
```
Leaks internal error details via `details` field.

### 4. `GET /api/debate/[debateId]` — No Authorization Check on Debate Access
**File:** `src/app/api/debate/[debateId]/route.ts:8-51`
```typescript
export async function GET(...) {
  const userId = await getUserId();
  // ... fetches debate
  // Returns debate to ANY requester, even unauthenticated
  return NextResponse.json({ debate: result.debate, isOwner, isAuthenticated });
}
```
**Risk:** Any debate's full message history is accessible to anyone who knows the UUID. The `isOwner` flag is informational only — the full data is still returned.  
**Note:** This may be intentional (debates are shareable). If so, document it explicitly. If not, add an auth check or limit non-owner responses to metadata only.  
**Severity:** Depends on intent — Low if intentional, High if not.

### 5. Stripe Price Endpoint Leaks Error Messages
**File:** `src/app/api/stripe/price/route.ts`
```typescript
return NextResponse.json({
  ...fallbackData,
  error: error.message  // Raw error to client
});
```
**Severity:** Low

---

## 🟡 Security Observations (Non-Critical)

### 6. In-Memory Debate Store (`memoryDebates`)
**File:** `src/app/api/debate/[debateId]/route.ts:5`
```typescript
const memoryDebates = new Map<string, any>();
```
This is a development fallback but it's active in production. Memory store is per-instance on Vercel (not shared), so it's low risk but clutters production code. Consider removing or gating behind `NODE_ENV`.

### 7. `LOCAL_DEV_BYPASS` Skips Message Limits
**Files:** `src/app/api/debate/route.ts:49`, `src/app/api/debate/takeover/route.ts:39`
```typescript
const isLocalDev = process.env.NODE_ENV === "development" || process.env.LOCAL_DEV_BYPASS === "true";
```
If `LOCAL_DEV_BYPASS` is accidentally set in production, all message limits are bypassed. Should be `NODE_ENV === 'development'` only.

### 8. No CORS Headers on API Routes
No explicit CORS configuration. Relies on Vercel's defaults (same-origin). This is fine for now but should be explicit if APIs are ever consumed cross-origin.

### 9. Embed Endpoint Sets `X-Frame-Options: ALLOWALL`
**File:** `src/app/api/embed/[debateId]/route.ts:74`
Intentional for iframe embedding. Acceptable — but should be scoped with CSP `frame-ancestors` for tighter control.

---

## ✅ Security Positives

- **SQL injection safe:** All D1 queries use parameterized `?` placeholders via Cloudflare API
- **Auth on all protected routes:** Clerk `auth()` / `getUserId()` checks present on create, debate, takeover, checkout, manage, profile, debates, subscription
- **Stripe webhook signature verification:** Properly validates `stripe-signature` header
- **No secrets in client code:** All sensitive env vars are server-side only (`NEXT_PUBLIC_` prefix only on safe vars)
- **Input validation:** `debateId`, `topic`, `userArgument` validated for presence
- **HTTPS enforced:** HSTS header present in production

---

## Error Handling Audit

### Consistency Issues

| Endpoint | Error Format | Consistent? |
|----------|-------------|-------------|
| `GET /api/debate/[debateId]` | `{ error: string }` | ✅ |
| `POST /api/debate/[debateId]` | `{ error: string, details: string }` | ⚠️ Leaks details |
| `POST /api/debate/create` | `{ error: string }` | ✅ |
| `POST /api/debate` | `{ error: string }` | ✅ |
| `POST /api/debate/takeover` | `{ error: string }` | ✅ |
| `GET /api/debates` | `{ error: string }` | ✅ |
| `GET /api/share/[debateId]` | `{ error: string }` | ✅ |
| `GET /api/embed/[debateId]` | Raw string `'Internal Server Error'` | ❌ Not JSON |
| `GET /api/trending` | No error handling shown | ⚠️ |
| `POST /api/stripe/create-checkout` | `{ error, type, code, details }` | ⚠️ Over-exposes |
| `POST /api/stripe/manage` | `{ error: error.message }` | ⚠️ Raw message |
| `POST /api/stripe/webhook` | Mixed: `{ error: string }` and raw | ⚠️ |
| `GET /api/stripe/price` | `{ ...data, error: error.message }` | ⚠️ |
| `GET /api/profile` | `{ error: string }` | ✅ |
| `POST /api/profile` | `{ error: string }` | ✅ |
| `GET /api/subscription` | `{ error: string }` | ✅ |
| `POST /api/test-webhook` | Always 200 | ⚠️ No validation |
| `GET /api/og` | Implicit (image gen) | ⚠️ No explicit error |

### Recommended Standard Error Format
```typescript
{ 
  error: string,        // Human-readable, safe for client
  code?: string,        // Machine-readable error code (optional)
  status: number        // HTTP status (in header, not body)
}
```
Never include: `details`, `error.message`, `error.stack`, `error.type`, `error.code` from raw exceptions.

---

## Recommended Fixes (Priority Order)

1. **🔴 Remove webhook secret logging** — `stripe/webhook/route.ts:25` — one line delete
2. **🔴 Sanitize Stripe error responses** — `stripe/create-checkout`, `stripe/manage` — replace `error.message` with generic strings
3. **🔴 Remove or gate test-webhook** — `test-webhook/route.ts` — delete or add env check
4. **🟡 Sanitize debate POST error** — `debate/[debateId]/route.ts:140` — remove `details` field
5. **🟡 Make embed error return JSON** — `embed/[debateId]/route.ts` — use `NextResponse.json()` instead of raw string
6. **🟡 Remove `LOCAL_DEV_BYPASS`** — rely on `NODE_ENV` only
7. **🟢 Document debate access policy** — confirm intentional public access or add auth
