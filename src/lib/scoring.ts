/**
 * Debate scoring prompt and types
 * Used to evaluate and score completed debates
 */

export interface DebateScore {
  winner: 'user' | 'ai' | 'draw';
  userScore: number;      // 0-100
  aiScore: number;        // 0-100
  summary: string;        // 2-3 sentence debate summary
  userStrength: string;   // Best thing the user did
  aiStrength: string;     // Best thing the AI did
  keyMoment: string;      // The turning point or most impactful exchange
  categories: {
    logic: { user: number; ai: number };       // 0-10
    evidence: { user: number; ai: number };     // 0-10
    persuasion: { user: number; ai: number };   // 0-10
    clarity: { user: number; ai: number };      // 0-10
    rebuttal: { user: number; ai: number };     // 0-10
  };
}

export function getScoringPrompt(topic: string, messages: Array<{ role: string; content: string }>): string {
  // Build the debate transcript
  const transcript = messages
    .filter(m => m.role === 'user' || m.role === 'ai')
    .map(m => `${m.role === 'user' ? 'USER' : 'AI OPPONENT'}: ${m.content}`)
    .join('\n\n');

  return `You are a debate judge. Score this debate fairly and concisely.

TOPIC: "${topic}"

TRANSCRIPT:
${transcript}

Score each side on these categories (0-10 each):
1. Logic — Strength of reasoning, internal consistency
2. Evidence — Use of facts, examples, data
3. Persuasion — Emotional impact, rhetorical skill
4. Clarity — How well they communicated their points
5. Rebuttal — How effectively they countered the opponent

Then provide:
- Overall scores (0-100) for each side
- Winner (user, ai, or draw if within 5 points)
- A 2-3 sentence summary of the debate
- Each side's biggest strength (1 sentence each)
- The key moment / turning point (1 sentence)

Be fair. Don't favor either side. Judge purely on argument quality.

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "winner": "user" | "ai" | "draw",
  "userScore": <0-100>,
  "aiScore": <0-100>,
  "summary": "<2-3 sentences>",
  "userStrength": "<1 sentence>",
  "aiStrength": "<1 sentence>",
  "keyMoment": "<1 sentence>",
  "categories": {
    "logic": { "user": <0-10>, "ai": <0-10> },
    "evidence": { "user": <0-10>, "ai": <0-10> },
    "persuasion": { "user": <0-10>, "ai": <0-10> },
    "clarity": { "user": <0-10>, "ai": <0-10> },
    "rebuttal": { "user": <0-10>, "ai": <0-10> }
  }
}`;
}
