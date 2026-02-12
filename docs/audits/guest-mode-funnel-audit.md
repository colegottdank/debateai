# Guest Mode Funnel Audit

**Date:** 2026-02-12
**Auditor:** Pixel (Frontend Agent)
**Branch:** `feat/jx74pk8946vzryddwx9j8da2xn8118hy-audit-guest-mode-funnel`

## Summary
The "Guest Mode" funnel is currently a **Misleading User Experience**. The UI promises a "try now, save later" workflow, but the implementation enforces a hard "sign-in to start" gate.

## Findings

### 1. 🚨 Critical: Misleading "Guest Mode" Promise
- **UI Claim:** "We'll save your debate after you sign in — takes 10 seconds". This implies the user can start debating immediately as a guest.
- **Actual Behavior:** Clicking "Start Debate" immediately triggers the sign-in flow (or blocks if auth is unavailable). No debate is created until *after* authentication.
- **Impact:** High friction. Users expect to sample the product but are hit with a login wall immediately. The text sets a false expectation.

### 2. 🐛 Developer Experience: Broken in Local Dev
- **Issue:** Without Clerk environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`), the "Start Debate" button becomes unresponsive.
- **Mechanism:** 
  - `startDebate` calls `openSignIn`.
  - `useSafeClerk` mocks `openSignIn` as a no-op when keys are missing.
  - Result: User clicks, nothing happens. No error feedback in UI.
- **Impact:** Developers cannot test the core "Start Debate" flow locally without production keys.

### 3. 🔒 Backend Constraint
- **Endpoint:** `/api/debate/create`
- **Logic:** Explicitly checks `if (!userId) return errors.unauthorized()`.
- **Constraint:** The backend currently does not support anonymous/guest debates.

## Recommendations

### Short Term (Content Fix)
- **Action:** Update the landing page copy to be honest.
- **Change:** Remove "We'll save your debate after you sign in".
- **New Text:** "Sign in to challenge the AI." (or similar)
- **Why:** Aligns expectations with reality.

### Medium Term (Feature: True Guest Mode)
- **Action:** Allow `/api/debate/create` to accept unauthenticated requests (rate-limited by IP).
- **Implementation:**
  - Generate a temporary `guestId`.
  - Store debate with `guestId` or `userId`.
  - On the frontend, allow the user to chat for N turns.
  - Prompt for sign-in to save/continue beyond N turns.
- **Why:** Reduces activation energy. "Try before you buy" (sign up).

### Dev Experience Fix
- **Action:** In `useSafeClerk`, if in development mode and keys are missing, mock a sign-in (e.g., set a dummy `userId` in context) or provide a UI warning "Clerk keys missing - Sign In disabled".

## Scope Limitation
This audit was limited to the landing page interaction. Due to the missing Clerk environment variables in the local environment, it was not possible to proceed past the "Start Debate" button to audit the actual debate interface or the sign-up modal itself.
