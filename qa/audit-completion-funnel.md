# Audit Report: Debate Completion Funnel
**Date:** 2026-02-12
**Agent:** Pixel
**Scope:** Landing Page -> Start Debate -> Sign In

## 🚨 Critical Findings

### 1. High Friction: Forced Sign-In
**Severity:** Critical (Primary Drop-off Point)
**Observation:**
- User types an argument on the landing page.
- User clicks "Start Debate".
- User is **immediately** presented with a Sign-In modal (Clerk).
- Copy says: "We'll save your debate after you sign in".
- **Impact:** Users who want to "try" the AI are blocked by a registration wall before seeing any value. This likely accounts for the low 3.2% completion rate.

**Recommendation:**
- **Implement Guest Mode:** Allow the debate to start immediately without sign-in.
- Store the debate in `sessionStorage` or a temporary guest record.
- Trigger sign-in only when the user wants to "Save" the debate or after X turns.
- **Value First:** Show the AI's response to their argument *before* asking for email.

### 2. Mobile Layout Overflow
**Severity:** High
**Observation:**
- On mobile viewport (390px), the landing page content appears cut off on the right side.
- Horizontal scrolling is possible (or content is hidden/clipped).
- Desktop navigation links ("Explore") were visible in some states, suggesting breakpoint issues or content forcing width > 390px.
- **Impact:** The site feels broken on mobile, reducing trust and usability.

**Potential Causes:**
- `container-wide` class might have padding/margin issues on small screens.
- Fixed width elements in the "Today's Debate" card or "Argument Input".
- Tailwind `sm:` breakpoint might be triggering incorrectly or `viewport` meta tag issue (though tag was present).

### 3. "Start Debate" Button State
**Severity:** Medium
**Observation:**
- Button is disabled until input is typed.
- Visual feedback is subtle.
- **Recommendation:** Keep button enabled but show a tooltip or shake animation if clicked while empty, prompting "Type an argument first". Or change text to "Enter argument to start".

---

## 🛠️ Technical Debt

- **Local Environment:** Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` prevents local testing of auth flow.
- **Browser Testing:** Resize actions on production URL returned inconsistent viewport widths (780px instead of 390px), possibly indicating responsive design bugs or tooling limitations.

## 🚀 Action Plan

1. **Guest Mode Feature:** Create a new task to refactor `HomeClient.tsx` and `api/debate/create` to support guest debates (cookie-based or ephemeral).
2. **Mobile Fix:** Investigate `globals.css` and `Header.tsx` container widths. Ensure `max-width: 100%` is applied to all main containers.
3. **Env Setup:** Request team to add Clerk keys to `.env.example` or shared secrets.
