export interface DebateScore {
  userScore: number;
  aiScore: number;
  totalRounds: number;
  bestBurn: string;
  bestBurnBy: 'user' | 'ai';
  survivedRounds: number;
  verdict: string;
  roastLevel: 'destroyed' | 'roasted' | 'held_own' | 'dominated';
}

export function calculateDebateScore(messages: Array<{ role: string; content: string }>): DebateScore {
  let userScore = 0;
  let aiScore = 0;
  let bestBurn = '';
  let bestBurnScore = 0;
  let bestBurnBy: 'user' | 'ai' = 'ai';
  
  // Count rounds (user message + ai response = 1 round)
  // Filter out system messages and count actual debate messages
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'ai' || m.role === 'assistant');
  const totalRounds = Math.min(userMessages.length, aiMessages.length);
  
  // Analyze each message for scoring
  messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      // Score user messages
      const score = scoreMessage(msg.content);
      userScore += score;
      
      if (score > bestBurnScore) {
        bestBurnScore = score;
        bestBurn = getBestLine(msg.content);
        bestBurnBy = 'user';
      }
    } else if (msg.role === 'assistant' || msg.role === 'ai') {
      // Score AI messages - AI gets big advantage (they're master debaters!)
      const score = scoreMessage(msg.content);
      aiScore += score * 2.5; // Significant advantage for the AI characters
      
      if (score * 1.5 > bestBurnScore) { // AI burns are weighted heavier
        bestBurnScore = score * 1.5;
        bestBurn = getBestLine(msg.content);
        bestBurnBy = 'ai';
      }
    }
  });
  
  // Determine verdict and roast level
  const scoreDiff = aiScore - userScore;
  let verdict: string;
  let roastLevel: 'destroyed' | 'roasted' | 'held_own' | 'dominated';
  
  if (scoreDiff > 50) {
    verdict = "Got COMPLETELY DESTROYED";
    roastLevel = 'destroyed';
  } else if (scoreDiff > 20) {
    verdict = "Got roasted hard";
    roastLevel = 'roasted';
  } else if (scoreDiff > 0) {
    verdict = "Put up a decent fight";
    roastLevel = 'held_own';
  } else {
    verdict = "Actually won?! (Cartman demands rematch)";
    roastLevel = 'dominated';
  }
  
  return {
    userScore: Math.round(userScore),
    aiScore: Math.round(aiScore),
    totalRounds,
    bestBurn: bestBurn || "No good burns detected (weak debate!)",
    bestBurnBy,
    survivedRounds: totalRounds,
    verdict,
    roastLevel
  };
}

function scoreMessage(content: string): number {
  let score = 0;
  
  // Base score for message length (capped at 5 points)
  score += Math.min(content.length / 100, 5);
  
  // Small bonus for exclamation marks (capped)
  score += Math.min((content.match(/!/g) || []).length * 0.5, 3);
  
  // Small bonus for question marks (capped)
  score += Math.min((content.match(/\?/g) || []).length * 0.5, 2);
  
  // Bonus for ALL CAPS sections (intensity!)
  const capsMatches = content.match(/\b[A-Z]{3,}\b/g) || [];
  score += Math.min(capsMatches.length * 1, 5);
  
  // Bonus for savage keywords
  const savageWords = [
    'destroyed', 'idiot', 'stupid', 'dumb', 'pathetic', 'weak',
    'mom', 'fat', 'cry', 'tears', 'owned', 'rekt', 'burned',
    'savage', 'brutal', 'demolished', 'annihilated', 'crushed',
    'retarded', 'goddamn', 'hippie', 'asshole', 'crap'
  ];
  
  let savageCount = 0;
  savageWords.forEach(word => {
    if (content.toLowerCase().includes(word)) {
      savageCount++;
    }
  });
  score += Math.min(savageCount * 2, 10);
  
  // Bonus for South Park references
  const spReferences = [
    'authoritah', 'jew', 'kyle', 'stan', 'kenny', 'butters',
    'respect my', 'oh my god', 'bastard', 'killed kenny',
    'cartman', 'master debater', 'charlie kirk', 'getting that nut'
  ];
  
  let spCount = 0;
  spReferences.forEach(ref => {
    if (content.toLowerCase().includes(ref)) {
      spCount++;
    }
  });
  score += Math.min(spCount * 3, 12);
  
  return Math.round(score);
}

function getBestLine(content: string): string {
  // Try to extract the most savage sentence
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) return content.slice(0, 100);
  
  // Score each sentence and return the best one
  let bestSentence = sentences[0];
  let bestScore = 0;
  
  sentences.forEach(sentence => {
    const score = scoreMessage(sentence);
    if (score > bestScore) {
      bestScore = score;
      bestSentence = sentence;
    }
  });
  
  return bestSentence.trim();
}

export function getHumiliatingTitle(score: DebateScore, characterName: string): string {
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