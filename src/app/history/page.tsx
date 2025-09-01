'use client';

import { useState, useEffect } from 'react';
import { useUser, SignedIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { opponents, getOpponentById, OpponentType } from '@/lib/opponents';
import UpgradeModal from '@/components/UpgradeModal';

interface Debate {
  id: string;
  opponent: OpponentType;
  topic: string;
  messages: Array<{ role: string; content: string }>;
  created_at: string;
  user_score?: number;
  ai_score?: number;
}

export default function HistoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentType | 'all'>('all');
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [subscription, setSubscription] = useState<{
    isSubscribed: boolean;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  }>({ isSubscribed: false });

  useEffect(() => {
    fetchDebates();
    fetchSubscription();
  }, []);

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

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription({
          isSubscribed: data.isSubscribed,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const filteredDebates = debates.filter(debate => {
    if (!debate || !debate.topic) return false;
    
    const matchesSearch = debate.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOpponent = selectedOpponent === 'all' || debate.opponent === selectedOpponent;
    return matchesSearch && matchesOpponent;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getMessageCount = (debate: Debate) => {
    if (!debate.messages || !Array.isArray(debate.messages)) return 0;
    return debate.messages.filter(m => m.role === 'user' || m.role === 'ai').length;
  };

  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
      const response = await fetch('/api/stripe/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.pathname + window.location.search
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL received. Response:', data);
        setIsManagingSubscription(false);
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      setIsManagingSubscription(false);
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-medium text-slate-100">
              DebateAI
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/debate" className="text-slate-400 hover:text-slate-100 transition-colors text-sm">
                New Debate
              </Link>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Debate History</h1>
            <p className="text-slate-400">Review and continue your previous debates</p>
          </div>

          {/* Subscription Status */}
          {!isLoading && (
            <div className={`mb-8 p-6 rounded-lg border ${
              subscription.isSubscribed 
                ? 'bg-indigo-900/20 border-indigo-700' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{subscription.isSubscribed ? '👑' : '🔒'}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {subscription.isSubscribed ? 'Premium Member' : 'Free Plan'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {subscription.isSubscribed 
                        ? 'Unlimited debates and messages' 
                        : `${debates.length}/3 debates used • Upgrade for unlimited access`}
                    </p>
                  </div>
                </div>
                
                <div>
                  {subscription.isSubscribed ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isManagingSubscription}
                      className={`px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm font-medium transition-colors ${
                        isManagingSubscription ? 'opacity-50 cursor-wait' : ''
                      }`}
                    >
                      {isManagingSubscription ? 'Loading...' : 'Manage'}
                    </button>
                  ) : (
                    <button
                      onClick={handleUpgrade}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
              
              {subscription.isSubscribed && subscription.currentPeriodEnd && (
                <div className="mt-3 text-xs text-slate-500">
                  {subscription.cancelAtPeriodEnd 
                    ? `Subscription ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </div>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search debates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-500"
            />
            
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value as OpponentType | 'all')}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-100"
            >
              <option value="all">All Opponents</option>
              {opponents.map(opponent => (
                <option key={opponent.id} value={opponent.id}>
                  {opponent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Debates List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-slate-400">Loading debates...</div>
            </div>
          ) : filteredDebates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400">
                {debates.length === 0 
                  ? "No debates yet. Start your first debate!"
                  : "No debates match your search."}
              </div>
              {debates.length === 0 && (
                <Link href="/debate" className="inline-block mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">
                  Start First Debate
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDebates.map((debate) => {
                const opponent = getOpponentById(debate.opponent);
                if (!opponent) return null;
                
                return (
                  <div
                    key={debate.id}
                    onClick={() => router.push(`/debate/${debate.id}`)}
                    className="p-6 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{opponent.emoji}</div>
                        <div>
                          <h3 className="font-semibold text-slate-100">{opponent.name}</h3>
                          <p className="text-xs text-slate-500">{opponent.style}</p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(debate.created_at)}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Topic</h4>
                      <p className="text-slate-100">{debate.topic}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>💬 {getMessageCount(debate)} messages</span>
                        {debate.user_score !== undefined && debate.ai_score !== undefined && (
                          <span>
                            Score: {debate.user_score} - {debate.ai_score}
                          </span>
                        )}
                      </div>
                      <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                        Continue →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats Summary */}
          {debates.length > 0 && (
            <div className="mt-12 p-6 bg-slate-800 border border-slate-700 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-100">{debates.length}</div>
                  <div className="text-sm text-slate-400">Total Debates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">
                    {debates.reduce((sum, d) => sum + getMessageCount(d), 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">
                    {(() => {
                      const counts = debates.reduce((acc, d) => {
                        acc[d.opponent] = (acc[d.opponent] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const [opponentId] = Object.entries(counts).sort(([,a], [,b]) => b - a)[0] || ['', 0];
                      const opponent = getOpponentById(opponentId as OpponentType);
                      return opponent?.name || 'None';
                    })()}
                  </div>
                  <div className="text-sm text-slate-400">Most Debated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">
                    {debates.filter(d => (d.user_score || 0) > (d.ai_score || 0)).length}
                  </div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />
    </div>
  );
}