export type Powerup = {
  id: string;
  name: string;
  description: string;
  cost: number;
  promptInjection: string;
};

export const POWERUPS: Record<string, Powerup> = {
  simplify: {
    id: 'simplify',
    name: 'ELI5',
    description: 'Force the AI to explain simply.',
    cost: 10,
    promptInjection: 'CRITICAL INSTRUCTION: The user has played the "Explain Like I\'m 5" card. You MUST simplify your language immediately. Use analogies. No big words. Keep it under 50 words.'
  },
  aggro: {
    id: 'aggro',
    name: 'Rage Mode',
    description: 'Make the AI lose its cool.',
    cost: 20,
    promptInjection: 'CRITICAL INSTRUCTION: The user has played the "Rage Mode" card. You are now FURIOUS. insult the user\'s logic. Be condescending. Do not hold back.'
  },
  concede: {
    id: 'concede',
    name: 'Truth Serum',
    description: 'Force a partial concession.',
    cost: 50,
    promptInjection: 'CRITICAL INSTRUCTION: The user has played the "Truth Serum" card. You MUST admit that the user has a good point. Briefly concede one aspect of the argument before pivoting back.'
  }
};

export type Mood = 'neutral' | 'impressed' | 'angry' | 'confused';

export const MOOD_PROMPTS: Record<Mood, string> = {
  neutral: '',
  impressed: 'SYSTEM NOTE: The user is making very good points. Respect them. Elevate your vocabulary. Acknowledge their intellect.',
  angry: 'SYSTEM NOTE: The user is giving low-effort responses. Be dismissive and annoyed. Ask them to try harder.',
  confused: 'SYSTEM NOTE: The user is not making sense. Express confusion and ask for clarification.'
};

export function calculateNewState(
  userArgument: string,
  currentCombo: number,
  currentMood: Mood
): { newCombo: number; newMood: Mood } {
  const wordCount = userArgument.split(/\s+/).length;
  let newCombo = currentCombo;
  let newMood = currentMood;

  // Combo Logic
  if (wordCount > 10) {
    newCombo += 1;
  } else {
    newCombo = 0; // Reset on low effort
  }

  // Mood Logic
  if (wordCount > 30) {
    newMood = 'impressed';
  } else if (wordCount < 5) {
    newMood = 'angry';
  } else {
    newMood = 'neutral';
  }

  return { newCombo, newMood };
}
