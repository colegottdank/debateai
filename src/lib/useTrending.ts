import { useState, useEffect } from 'react';

export interface TrendingTopic {
  id: string;
  question: string;
  context: string;
  source: string;
  category: 'politics' | 'tech' | 'culture' | 'business' | 'science' | 'sports';
  heat: 1 | 2 | 3;
}

interface TrendingResponse {
  topics: TrendingTopic[];
  cached?: boolean;
  fallback?: boolean;
  error?: string;
}

export function useTrending() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch('/api/trending');
        const data: TrendingResponse = await response.json();
        
        setTopics(data.topics || []);
        setIsFallback(data.fallback || false);
        setError(data.error || null);
      } catch (e) {
        setError('Failed to load trending topics');
        setTopics([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  return { topics, loading, error, isFallback };
}
