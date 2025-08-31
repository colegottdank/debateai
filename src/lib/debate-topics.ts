export const DEBATE_TOPICS = [
  // Technology & AI
  "Should AI development be paused until we have better safety regulations?",
  "Is social media doing more harm than good to society?",
  "Should we upload human consciousness to computers when possible?",
  "Are smartphones making us less intelligent?",
  "Should facial recognition technology be banned in public spaces?",
  "Is the metaverse the future of human interaction?",
  "Should AI be allowed to make life-or-death decisions?",
  "Are we too dependent on technology?",
  "Should children under 16 be banned from social media?",
  "Is technological progress always good for humanity?",
  
  // Ethics & Philosophy
  "Is lying ever morally justified?",
  "Do we have free will or is everything predetermined?",
  "Is existence inherently meaningless?",
  "Are humans naturally good or evil?",
  "Is it ethical to eat meat?",
  "Should we have the right to die?",
  "Is morality objective or subjective?",
  "Can war ever be justified?",
  "Is happiness the ultimate goal of life?",
  "Do the needs of the many outweigh the needs of the few?",
  
  // Society & Politics
  "Should billionaires exist?",
  "Is democracy the best form of government?",
  "Should borders between countries exist?",
  "Is capitalism sustainable long-term?",
  "Should voting be mandatory?",
  "Is universal basic income necessary?",
  "Should hate speech be protected as free speech?",
  "Is cancel culture justified?",
  "Should we abolish prisons?",
  "Is nationalism dangerous?",
  
  // Environment & Future
  "Is it ethical to have children given climate change?",
  "Should we colonize Mars before fixing Earth?",
  "Is nuclear energy the solution to climate change?",
  "Should we genetically modify humans?",
  "Is degrowth the only solution to environmental crisis?",
  "Should we bring back extinct species?",
  "Are electric vehicles really better for the environment?",
  "Should we ban private jets?",
  "Is overpopulation a real problem?",
  "Should meat consumption be heavily taxed?",
  
  // Education & Knowledge
  "Should college education be free?",
  "Are grades harmful to learning?",
  "Should we teach philosophy to children?",
  "Is homeschooling better than traditional schooling?",
  "Should critical race theory be taught in schools?",
  "Are standardized tests useful?",
  "Should coding be mandatory in schools?",
  "Is a college degree still worth it?",
  "Should schools ban smartphones entirely?",
  "Are trigger warnings necessary?",
  
  // Economics & Work
  "Should there be a maximum wage?",
  "Is the 40-hour work week outdated?",
  "Should we abolish tipping culture?",
  "Are labor unions still necessary?",
  "Should inheritance be heavily taxed?",
  "Is remote work better than office work?",
  "Should we have a four-day work week?",
  "Are cryptocurrencies the future of money?",
  "Should housing be a human right?",
  "Is economic growth necessary for prosperity?",
  
  // Science & Medicine
  "Should we edit human genes to prevent diseases?",
  "Is alternative medicine legitimate?",
  "Should vaccines be mandatory?",
  "Are we alone in the universe?",
  "Should we clone humans for organ harvesting?",
  "Is aging a disease we should cure?",
  "Should performance-enhancing drugs be allowed in sports?",
  "Are placebos ethical in medicine?",
  "Should we trust scientific consensus?",
  "Is animal testing justified?",
  
  // Culture & Identity
  "Is cultural appropriation real?",
  "Should we separate art from the artist?",
  "Are gender roles harmful?",
  "Is monogamy natural?",
  "Should prostitution be legal?",
  "Is religion beneficial to society?",
  "Are beauty standards oppressive?",
  "Should we use gender-neutral language?",
  "Is patriotism different from nationalism?",
  "Are traditions worth preserving?",
  
  // Media & Information
  "Should news be required to be objective?",
  "Is censorship ever justified?",
  "Are influencers harmful to society?",
  "Should we regulate misinformation?",
  "Is privacy dead in the digital age?",
  "Are video games too violent?",
  "Should algorithms be transparent?",
  "Is binge-watching harmful?",
  "Should we ban targeted advertising?",
  "Are podcasts replacing traditional media?",
  
  // Provocative & Philosophical
  "Would you rather be happy or know the truth?",
  "Is suffering necessary for growth?",
  "Should we fear death?",
  "Is love just a chemical reaction?",
  "Are we living in a simulation?",
  "Is time travel possible?",
  "Should we contact alien civilizations?",
  "Is consciousness an illusion?",
  "Can machines ever be truly conscious?",
  "Is reality objective or subjective?"
];

export function getRandomTopic(excludeTopics: string[] = []): string {
  const availableTopics = DEBATE_TOPICS.filter(topic => !excludeTopics.includes(topic));
  
  if (availableTopics.length === 0) {
    // If all topics have been shown, reset and pick from all
    return DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
  }
  
  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

export function getDailyQuestion(): string {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use day of year to deterministically select a topic
  // This ensures the same topic for all users on the same day
  const index = dayOfYear % DEBATE_TOPICS.length;
  return DEBATE_TOPICS[index];
}

export function getTopicsByCategory() {
  return {
    "Technology & AI": DEBATE_TOPICS.slice(0, 10),
    "Ethics & Philosophy": DEBATE_TOPICS.slice(10, 20),
    "Society & Politics": DEBATE_TOPICS.slice(20, 30),
    "Environment & Future": DEBATE_TOPICS.slice(30, 40),
    "Education & Knowledge": DEBATE_TOPICS.slice(40, 50),
    "Economics & Work": DEBATE_TOPICS.slice(50, 60),
    "Science & Medicine": DEBATE_TOPICS.slice(60, 70),
    "Culture & Identity": DEBATE_TOPICS.slice(70, 80),
    "Media & Information": DEBATE_TOPICS.slice(80, 90),
    "Provocative & Philosophical": DEBATE_TOPICS.slice(90, 100)
  };
}