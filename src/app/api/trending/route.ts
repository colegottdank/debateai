import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Cache trending topics for 1 hour
let cachedTopics: TrendingTopic[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export interface TrendingTopic {
  id: string;
  question: string;
  context: string;
  source: string;
  category: 'politics' | 'tech' | 'culture' | 'business' | 'science' | 'sports';
  heat: 1 | 2 | 3; // How hot/controversial
}

interface NewsItem {
  title: string;
  description?: string;
  url: string;
  source?: string;
}

async function fetchTrendingNews(): Promise<NewsItem[]> {
  // Use multiple sources for variety
  const queries = [
    'controversial news today',
    'debate politics 2024',
    'tech controversy',
    'viral social media debate',
  ];
  
  const allNews: NewsItem[] = [];
  
  for (const query of queries.slice(0, 2)) { // Limit to avoid rate limits
    try {
      // Using Brave Search API via environment variable
      const response = await fetch(
        `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || '',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          allNews.push(...data.results.map((r: any) => ({
            title: r.title,
            description: r.description,
            url: r.url,
            source: r.meta_url?.hostname || 'news',
          })));
        }
      }
    } catch (e) {
      console.error('Error fetching news:', e);
    }
  }
  
  return allNews;
}

async function convertToDebateTopics(news: NewsItem[]): Promise<TrendingTopic[]> {
  if (news.length === 0) return [];
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  const newsText = news.slice(0, 10).map((n, i) => 
    `${i + 1}. "${n.title}" - ${n.description || ''} (${n.source})`
  ).join('\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Convert these news headlines into 5-6 provocative debate questions. Each should be a yes/no or "which side" question that people would actually argue about.

NEWS:
${newsText}

Return JSON array with this format (no markdown, just raw JSON):
[
  {
    "id": "unique-slug",
    "question": "Should X do Y?",
    "context": "Brief context from the news (1 sentence)",
    "source": "source name",
    "category": "politics|tech|culture|business|science|sports",
    "heat": 1-3 (how controversial)
  }
]

Make questions punchy and debatable. Avoid boring policy questions. Go for takes people actually argue about.`
      }],
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse JSON, handling potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const topics = JSON.parse(jsonText) as TrendingTopic[];
    return topics.filter(t => t.question && t.id);
    
  } catch (e) {
    console.error('Error converting to topics:', e);
    return [];
  }
}

export async function GET() {
  // Check cache
  if (cachedTopics && Date.now() - cacheTime < CACHE_DURATION) {
    return NextResponse.json({ 
      topics: cachedTopics, 
      cached: true,
      cacheAge: Math.floor((Date.now() - cacheTime) / 1000 / 60) + ' minutes'
    });
  }
  
  try {
    // Fetch news
    const news = await fetchTrendingNews();
    
    if (news.length === 0) {
      // Fallback to static trending if no news available
      return NextResponse.json({ 
        topics: getFallbackTopics(),
        cached: false,
        fallback: true
      });
    }
    
    // Convert to debate topics
    const topics = await convertToDebateTopics(news);
    
    if (topics.length > 0) {
      // Update cache
      cachedTopics = topics;
      cacheTime = Date.now();
      
      return NextResponse.json({ topics, cached: false });
    } else {
      return NextResponse.json({ 
        topics: getFallbackTopics(),
        cached: false,
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Trending topics error:', error);
    return NextResponse.json({ 
      topics: getFallbackTopics(),
      error: 'Failed to fetch trending topics',
      fallback: true
    });
  }
}

function getFallbackTopics(): TrendingTopic[] {
  // Manually curated "evergreen hot" topics as fallback
  return [
    {
      id: 'ai-taking-jobs',
      question: 'Is AI actually coming for your job this year?',
      context: 'Tech layoffs continue while AI tools proliferate',
      source: 'Tech News',
      category: 'tech',
      heat: 3
    },
    {
      id: 'social-media-teens',
      question: 'Should kids under 16 be banned from social media?',
      context: 'Multiple states considering age restrictions',
      source: 'Politics',
      category: 'culture',
      heat: 2
    },
    {
      id: 'remote-work-over',
      question: 'Is remote work actually dying?',
      context: 'Return-to-office mandates spreading across industries',
      source: 'Business',
      category: 'business',
      heat: 2
    },
    {
      id: 'tipping-out-of-control',
      question: 'Has tipping culture gone too far?',
      context: 'Tip prompts now appearing everywhere from self-checkout to takeout',
      source: 'Culture',
      category: 'culture',
      heat: 2
    },
    {
      id: 'college-worth-it',
      question: 'Is a college degree still worth the debt?',
      context: 'Student loan debates continue as tuition rises',
      source: 'Education',
      category: 'culture',
      heat: 2
    },
  ];
}
