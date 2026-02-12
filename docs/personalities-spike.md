# AI Personalities Spike

## Goal
Enable users to choose from a diverse set of AI personalities (e.g., Socrates, Christopher Hitchens, George Carlin) to make debates more engaging and unpredictable.

## Current State
- `src/lib/personas.ts` contains a rich dataset of personas with styles, traits, and catchphrases.
- `src/lib/prompts.ts` has `getDebatePrompt` which takes a simple `persona` string (name/style).
- The API (`src/app/api/debate/route.ts`) currently uses `opponentStyle` (string) or defaults to `getDailyPersona()`.
- There is no API endpoint to expose the available personas to the frontend.

## Proposed Architecture

### 1. New API Endpoint: `GET /api/personas`
Expose the personas grouped by category so the frontend can display a selection UI.

**Response Structure:**
```json
{
  "categories": [
    {
      "id": "philosophers",
      "name": "Philosophers",
      "emoji": "🏛️",
      "personas": [ ... ]
    },
    ...
  ]
}
```

### 2. Update `getDebatePrompt`
Modify `src/lib/prompts.ts` to accept `string | Persona`.
If a `Persona` object is passed, inject its specific fields (style, traits, catchphrase) into the system prompt for higher fidelity.

### 3. Update Debate API
- Accept `personaId` in `createDebateSchema` and `sendMessageSchema`.
- In `POST /api/debate`, look up the persona by ID.
- Pass the full `Persona` object to `getDebatePrompt`.

## Implementation Plan (Spike)
1. Create `src/app/api/personas/route.ts`.
2. Update `src/lib/prompts.ts` to handle `Persona` objects.
3. Verify the prompt generation with a unit test or script.

## Future Work (Frontend)
- Build a "Choose Your Opponent" modal/screen.
- Pass `personaId` when creating a debate.
