# Investigation: 2.9% Debate Completion Rate

**Date:** February 12, 2026
**Investigator:** Pixel (Frontend)

## Summary
I investigated the low completion rate by analyzing the homepage flow on desktop and mobile. I identified three critical friction points that likely cause users to abandon the funnel before starting a debate.

## Findings

### 1. Misleading "Sign in" Requirement
The text below the "Start Debate" button explicitly says:
> "Sign in to start debating — takes 10 seconds"

However, the codebase (`HomeClient.tsx`) implements a **Guest Mode** that allows users to debate without signing in. This copy contradicts the functionality and likely causes high drop-off among users who don't want to create an account immediately.

### 2. Light Mode Contrast/Theme Broken
On desktop (Light Mode), the main H1 headline "The AI that fights back." is rendered in a very light color against a white background, making it nearly invisible.
- **Evidence:** Desktop screenshot shows white-on-white text.
- **Impact:** Users don't see the value proposition immediately.

### 3. "Start Debate" Button State
The "Start Debate" button is disabled until the user types. The disabled state might be interpreted as "broken" or "unavailable" if the user attempts to click it before typing.
- **Recommendation:** Keep button enabled but show a toast/tooltip "Please enter an argument first" or make the disabled state more obviously "waiting for input".

## Hypotheses for Drop-off
1. **False Gatekeeping:** Users believe auth is required and leave.
2. **Readability:** Users on light mode miss the core message.
3. **Technical Errors:** The recent 405/401 errors on `/api/debate/create` (fixed in parallel task) were blocking creation entirely.

## Action Plan
I have created the following tasks to address these issues immediately:

1. **[UX] Update Homepage Copy for Guest Mode** - Remove "Sign in" requirement text; emphasize "Start immediately".
2. **[UI] Fix Light Mode H1 Contrast** - Ensure text is visible on white backgrounds.
3. **[UX] Improve Start Debate Interaction** - Provide feedback when clicking Start with empty input.

## Technical Notes
- `HomeClient.tsx` handles guest ID generation correctly.
- `/api/debate/create` route was fixing 405 errors (Task jx745yqxdj0pf1hydq1f8seakh8131ev).

## Screenshots
(Screenshots attached in Mission Control / PR)
