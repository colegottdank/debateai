# Audit: Debate Flow Friction
**Date:** 2026-02-12
**Auditor:** Pixel

## Scope
User journey for unauthenticated (guest) users on Mobile (390px) and Desktop (1512px).

## Findings

### 1. Home Page "Start Debate" is Broken for Guests
- **Severity:** 🔴 Critical
- **Observation:**
  - User lands on Home.
  - Types argument into "What's your opening argument?".
  - "Start Debate" button becomes enabled (previously disabled).
  - **Action:** User clicks "Start Debate".
  - **Result:** **Nothing happens.** No navigation, no modal, no error message.
- **Impact:** Users assume the site is broken and bounce.
- **Fix:** Hook up the button to either:
  - Trigger the Sign In modal (Short term).
  - Start the debate in Guest Mode (Long term/Target).

### 2. Custom Debate Page Forces Hard Gate
- **Severity:** 🟠 High
- **Observation:**
  - User navigates to `/debate`.
  - Fills "Opponent" and "Topic".
  - Clicks "Start Debate".
  - **Result:** Immediate "Sign in to Debate AI" modal.
- **Impact:** User has invested effort (typing fields) but is roadblocked.
- **Fix:** Guest mode should allow 1-3 turns before forcing sign-up.

### 3. Visual Consistency
- **Severity:** 🟢 Low
- **Observation:**
  - The Sign In modal (Clerk) is bright white even when the site is in Dark Mode (default).
- **Fix:** Enable Dark Mode for Clerk components.

## Recommendations

1. **Merge PR #137 (Guest Mode) Immediately:** This solves the core friction by allowing users to debate without signing in.
2. **Hotfix Home Page Button:** Ensure the "Start Debate" button at least opens the Login modal if Guest Mode is inactive. Silent failure is unacceptable.
