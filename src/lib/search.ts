// Simple web search for current events and references
export async function searchForContext(query: string): Promise<string> {
  try {
    // For now, we'll use a simple approach since we don't have a dedicated search API
    // In a production app, you'd integrate with Google Search API, Bing API, etc.
    
    // Extract keywords from the query for search
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');
    
    if (!keywords) return '';
    
    // Simple mock search results for common topics
    const mockResults: Record<string, string> = {
      'pineapple pizza': 'Recent polls show 47% of Americans now support pineapple on pizza, up from 32% in 2020.',
      'climate change': 'Latest IPCC report shows global temperatures rising faster than expected.',
      'artificial intelligence': 'ChatGPT and AI tools now used by over 100 million people worldwide.',
      'social media': 'Meta and Twitter facing increased regulation in EU and US.',
      'cryptocurrency bitcoin': 'Bitcoin volatility continues with recent SEC approvals of ETFs.',
      'election politics': 'Upcoming elections showing increased polarization across demographics.',
      'healthcare': 'Post-pandemic healthcare systems still recovering from staffing shortages.',
      'education school': 'Remote learning adoption permanent in 35% of school districts.',
      'economy inflation': 'Federal Reserve monitoring inflation rates closely amid economic uncertainty.',
      'technology': 'AI and automation reshaping job markets across industries.'
    };
    
    // Find matching context
    for (const [topic, context] of Object.entries(mockResults)) {
      if (keywords.includes(topic) || topic.includes(keywords)) {
        return context;
      }
    }
    
    return '';
  } catch (error) {
    console.error('Search error:', error);
    return '';
  }
}

export function shouldSearchForTopic(topic: string): boolean {
  const searchableTopics = [
    'current events', 'news', 'politics', 'election', 'climate', 
    'technology', 'ai', 'social media', 'economy', 'healthcare',
    'education', 'cryptocurrency', 'bitcoin', 'inflation'
  ];
  
  return searchableTopics.some(searchTopic => 
    topic.toLowerCase().includes(searchTopic)
  );
}