# Audit Report: Guest Mode Funnel
**Date:** 2026-02-12
**Auditor:** Pixel (Frontend Agent)
**Status:** BLOCKED / CRITICAL FINDINGS

## Executive Summary
The "Guest Mode" funnel is currently a **hard authentication wall**. There is no ability for a guest to start a debate or interact with the AI before signing in. The promise "We'll save your debate after you sign in" is technically fulfilled via session storage, but the user experience is "Sign up to play", not "Play as guest".

Additionally, local development is **broken** for this flow due to missing Clerk authentication keys, making it impossible to verify the handoff from "Guest types topic" -> "Sign Up" -> "Debate Starts".

## Critical Findings

### 1. No "Guest Mode" Implementation
The current implementation forces `openSignIn()` immediately upon clicking "Start Debate".
- **Homepage:** `HomeClient.tsx` checks `!isSignedIn` and halts execution to open sign-in modal.
- **Custom Debate:** Same logic.
- **Result:** Guests cannot exchange even a single message with the AI.
- **Expectation:** A true "Guest Mode" usually allows 1-3 turns or a full debate before requiring sign-up.

### 2. Backend Requires Authentication
The `/api/debate/create` endpoint strictly enforces `getUserId()`.
- Returns `401 Unauthorized` if no user session exists.
- This confirms that even if the frontend check was removed, the backend would reject the request.

### 3. Local Development Blocked
The local environment lacks Clerk API keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`).
- **Impact:** `useSafeClerk` returns no-op functions.
- **Result:** Clicking "Start Debate" does nothing (no modal, no redirect, no error).
- **Severity:** High. Developers cannot test the core onboarding flow.

### 4. Participation Gated by Ownership
The `DebatePage` logic (`src/app/debate/[debateId]/page.tsx`) checks ownership:
```typescript
const { userId } = await auth();
isOwner = userId ? debate.user_id === userId : false;
```
- A guest viewing a debate (even one they just "created" if we allowed it) would see it in read-only mode unless we implement a session-based ownership mechanism.

## UI/UX Observations (Visual Audit)
- **Mobile Layout (390px):**
  - Homepage: Clean, no overflow. Input and button are accessible.
  - Explore: Clean.
  - Custom Debate: Clean.
- **Desktop Layout (1512px):**
  - Consistent and responsive.
- **Interaction:**
  - "Start Debate" button state updates correctly (disabled -> enabled).
  - "Start Debate" click provides no feedback in local dev (due to missing auth).

## Recommendations

1. **Decide on "Guest Mode" Definition:**
   - **Option A (Current):** "Sign up to start." Update copy to be clearer that sign-up is required *immediately*.
   - **Option B (True Guest):** Allow anonymous debate creation.
     - Action: Update backend to allow `userId` to be null or a session ID.
     - Action: Update frontend to skip `openSignIn` and call create API directly.
     - Action: Implement "Claim this debate" flow to attach anonymous debate to user after sign-up.

2. **Fix Local Dev Environment:**
   - Add a mock auth mode or share development keys.
   - Update `useSafeClerk` to log a warning when actions are blocked.

3. **Improve Onboarding UX:**
   - If enforcing sign-up, consider moving the sign-up *before* the input (or right after typing) to set expectations, rather than a button that looks like it starts the action but opens a modal.

## Next Steps
- Clarify requirements with Atlas: Is "Guest Mode" intended to be "Anonymous Play" or just "Defer Sign-up"?
- If Anonymous Play is the goal, this requires backend work (Forge).
