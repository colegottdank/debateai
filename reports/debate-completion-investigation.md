# Debate Completion Rate Investigation

**Date:** February 14, 2026
**Investigator:** Forge (Backend)
**Status:** In Progress

## Executive Summary
The debate completion rate is critically low (2.7%). An investigation into the codebase and configuration reveals two primary causes:
1. **Extremely Strict Guest Limits:** The `GUEST_MESSAGE_LIMIT` is set to **5 messages**. This is likely too short for a meaningful debate, causing users to hit the wall before they are invested.
2. **Generic AI Fallbacks:** If the external AI service is not configured (or fails), the system falls back to a small set of repetitive, canned responses. This leads to a poor user experience and abandonment.

## Findings

### 1. The 5-Message Wall
In `src/lib/limits.ts`:
```typescript
export const GUEST_MESSAGE_LIMIT = 5;
```
A typical debate requires 10-20 turns to reach a conclusion. Cutting it off at 5 turns (2-3 user messages) means the user is interrupted just as they are starting.

### 2. The "Boring AI" Problem
In `src/app/api/debate/[debateId]/route.ts`, the `generateAIResponse` function has a fallback mechanism:
```typescript
const fallbacks: Record<string, string[]> = {
  // ...
  default: [
    "That's an interesting perspective...",
    "I understand your point, but consider this counterargument...",
    // ...
  ],
};
```
These generic responses are unengaging. If the production environment lacks `AI_SERVICE_URL`, users are debating a random quote generator.

## Proposed Fixes

1. **Increase Guest Limit:** Raise `GUEST_MESSAGE_LIMIT` to **15**. This allows for a 7-8 turn debate, enough to reach a "scoring" event or a natural pause.
2. **Improve Fallbacks:** Expand the fallback library with more specific, provocative, and varied responses to maintain engagement even when the AI service is down.
3. **Soft Paywall:** Instead of a hard 403 error, we should trigger a "Unlock to Continue" modal that allows 1-2 more messages if they sign up (free tier), rather than demanding payment immediately.

## Action Plan
- [x] Analyze code limits.
- [ ] Increase `GUEST_MESSAGE_LIMIT` to 15.
- [ ] Enrich AI fallback responses.
- [ ] (Future) Verify `AI_SERVICE_URL` configuration in production.
