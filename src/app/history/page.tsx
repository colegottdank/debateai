'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import Header from '@/components/Header';

interface Debate {
  id: string;
  opponent: string;
  opponentStyle?: string;
  topic: string;
  messageCount: number;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Check authentication and prompt sign-in if needed
  useEffect(() => {
    if (isSignedIn === false) {
      openSignIn();
      router.push('/');
    } else if (isSignedIn === true) {
      fetchDebates();
    }
  }, [isSignedIn, openSignIn, router]);

  const fetchDebates = async () => {
    try {
      const response = await fetch('/api/debates');
      if (response.ok) {
        const data = await response.json();
        setDebates(data.debates || []);
      }
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDebates = debates.filter(debate => 
    debate.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (debate.opponentStyle && debate.opponentStyle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Show loading state while checking auth
  if (isSignedIn === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-xl font-medium text-slate-100 mb-3">Checking authentication...</div>
          <div className="inline-flex gap-1">
            <span className="dot-bounce"></span>
            <span className="dot-bounce"></span>
            <span className="dot-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-slate-100 mb-2">Debate History</h1>
            <p className="text-slate-400 text-sm">Continue your intellectual discussions</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search debates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700 text-sm"
            />
          </div>

          {/* Debates List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-slate-500 text-sm">Loading debates...</div>
            </div>
          ) : filteredDebates.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-slate-500 mb-4">
                {debates.length === 0 
                  ? "No debates yet" 
                  : "No debates match your search"}
              </div>
              {debates.length === 0 && (
                <Link 
                  href="/debate" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Start Your First Debate
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDebates.map((debate) => (
                <div
                  key={debate.id}
                  onClick={() => router.push(`/debate/${debate.id}`)}
                  className="group p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Topic */}
                      <h3 className="font-medium text-slate-100 mb-1 truncate">
                        {debate.topic}
                      </h3>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {debate.opponentStyle && (
                          <span className="truncate">
                            vs {debate.opponentStyle}
                          </span>
                        )}
                        <span>·</span>
                        <span>{debate.messageCount} messages</span>
                        <span>·</span>
                        <span>{formatDate(debate.createdAt)}</span>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {debates.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {debates.length} debate{debates.length !== 1 ? 's' : ''} total
                </div>
                <Link 
                  href="/debate" 
                  className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
                >
                  Start New Debate →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}