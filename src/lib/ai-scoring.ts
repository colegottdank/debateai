// AI scoring types and functions for client-side use
// The actual AI scoring happens server-side in /api/score-debate

export interface AIDebateScore {
  userScore: number;
  aiScore: number;
  totalRounds: number;
  bestBurn: string;
  bestBurnBy: 'user' | 'ai';
  survivedRounds: number;
  verdict: string;
  roastLevel: 'destroyed' | 'roasted' | 'held_own' | 'dominated';
}

export async function calculateAIDebateScore(
  messages: Array<{ role: string; content: string }>,
  characterName: string
): Promise<AIDebateScore> {
  try {
    // Call the server-side API for AI scoring
    const response = await fetch('/api/score-debate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        characterName
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to score debate');
    }
    
    const score = await response.json();
    return score;
    
  } catch (error) {
    console.error('AI scoring failed, falling back to simple scoring:', error);
    
    // Fallback to simple scoring if AI fails
    return fallbackScoring(messages, characterName);
  }
}

// Simple fallback scoring in case AI fails
function fallbackScoring(
  messages: Array<{ role: string; content: string }>,
  characterName: string
): AIDebateScore {
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'ai' || m.role === 'assistant');
  const totalRounds = Math.min(userMessages.length, aiMessages.length);
  
  // Simple scoring: AI always wins with 3x user score
  const userScore = 10 + (totalRounds * 5);
  const aiScore = userScore * 3;
  
  // Extract a random AI message as best burn
  const randomAiMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
  const bestBurn = randomAiMessage?.content.split('.')[0] || "You got destroyed!";
  
  return {
    userScore,
    aiScore,
    totalRounds,
    bestBurn,
    bestBurnBy: 'ai',
    survivedRounds: totalRounds,
    verdict: "Got roasted hard",
    roastLevel: 'roasted'
  };
}

export function getHumiliatingTitle(score: AIDebateScore, characterName: string): string {
  const titles = {
    destroyed: [
      `${characterName}'s Little B*tch`,
      `Got DEMOLISHED by ${characterName}`,
      `${characterName}'s Debate Victim #${Math.floor(Math.random() * 9999)}`,
      `Cried to Mom After ${characterName}`,
      `${characterName} Made Them Quit`
    ],
    roasted: [
      `Roasted by ${characterName}`,
      `${characterName} Won This Round`,
      `Couldn't Handle ${characterName}`,
      `Got Schooled by ${characterName}`
    ],
    held_own: [
      `Survived ${characterName}'s Wrath`,
      `Went Toe-to-Toe with ${characterName}`,
      `Almost Beat ${characterName}`,
      `Decent Showing Against ${characterName}`
    ],
    dominated: [
      `ACTUALLY BEAT ${characterName}?!`,
      `${characterName}'s Worst Nightmare`,
      `Made ${characterName} Cry`,
      `The One Who Beat ${characterName}`
    ]
  };
  
  const titleOptions = titles[score.roastLevel];
  return titleOptions[Math.floor(Math.random() * titleOptions.length)];
}