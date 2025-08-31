'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/useTestUser';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { opponents, getOpponentById, OpponentType } from '@/lib/opponents';
import UpgradeModal from '@/components/UpgradeModal';

interface Debate {
  id: string;
  character: OpponentType;
  topic: string;
  messageCount: number;
  createdAt: string;
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
    // Add null/undefined checks
    if (!debate || !debate.topic) return false;
    
    const matchesSearch = debate.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCharacter = selectedCharacter === 'all' || debate.character === selectedCharacter;
    return matchesSearch && matchesCharacter;
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
      console.log('Manage response:', data);
      
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
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Header Banner */}
      <div className="messy-banner p-2 text-center relative">
        <span className="font-black text-white text-sm tracking-wider">
          📼 DEBATE ARCHIVES 📼 YOUR PATHETIC HISTORY 📼 RELIVE YOUR DEFEATS 📼
        </span>
      </div>

      {/* Scattered Elements */}
      <div className="absolute top-20 left-8 text-3xl opacity-10 transform rotate-12 z-0 hidden sm:block">📚</div>
      <div className="absolute top-32 right-12 text-2xl opacity-15 transform -rotate-15 z-0 hidden sm:block">🎬</div>
      <div className="absolute top-1/3 left-16 text-xl opacity-20 transform rotate-45 z-0 hidden lg:block">📺</div>

      <div className="p-4 sm:p-8 relative z-10">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link href="/" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all transform hover:rotate-1 border-4 border-black shadow-lg">
            ← Back to Studio
          </Link>
          
          <Link href="/debate" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all transform hover:rotate-1 border-4 border-black shadow-lg">
            🆕 Start New Debate
          </Link>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black south-park-title mb-4">
              <span className="text-red-500">YOUR</span>
              <span className="text-yellow-400"> DEBATE </span>
              <span className="text-white">HISTORY</span>
            </h1>
            
            <div className="comic-bubble max-w-sm sm:max-w-xl mx-auto p-4 mb-6">
              <p className="text-sm sm:text-lg font-bold text-black">
                &quot;Look at all these times you got DESTROYED! Want to try again, loser?&quot;
              </p>
            </div>
          </div>

          {/* Subscription Status Card */}
          <div className={`mb-8 p-4 sm:p-6 rounded-2xl border-4 border-black shadow-lg transform ${subscription.isSubscribed ? '-rotate-1' : 'rotate-1'} ${subscription.isSubscribed ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{subscription.isSubscribed ? '👑' : '🔒'}</div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {subscription.isSubscribed ? 'PREMIUM MASTER DEBATER' : 'FREE PEASANT'}
                  </h3>
                  <p className="text-sm font-bold text-white/90">
                    {subscription.isSubscribed 
                      ? 'Unlimited debates and messages - You rule!' 
                      : `${debates.length}/3 debates used • Upgrade for unlimited`}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {subscription.isSubscribed ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isManagingSubscription}
                    className={`bg-white text-black font-black py-2 px-4 rounded-lg border-2 border-black ${isManagingSubscription ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'} transition-all text-sm`}
                  >
                    {isManagingSubscription ? '⏳ LOADING...' : '⚙️ MANAGE'}
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-4 rounded-lg border-2 border-black hover:scale-105 cursor-pointer transition-all text-sm"
                  >
                    💰 UPGRADE NOW
                  </button>
                )}
              </div>
            </div>
            
            {subscription.isSubscribed && subscription.currentPeriodEnd && (
              <div className="mt-3 text-xs font-bold text-white/80">
                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-black/50 border-4 border-yellow-400 rounded-2xl p-4 sm:p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-black/70 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none text-white font-bold"
              />
              
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value as Character | 'all')}
                className="p-3 rounded-lg bg-black/70 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none text-white font-bold"
              >
                <option value="all">All Characters</option>
                {characters.map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Debates Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-2xl font-black text-yellow-400 animate-pulse">
                Loading your shameful history...
              </div>
            </div>
          ) : filteredDebates.length === 0 ? (
            <div className="text-center py-12">
              <div className="comic-bubble inline-block p-6 text-black font-bold">
                {debates.length === 0 
                  ? "You haven't been destroyed yet? Start a debate!"
                  : "No debates match your search. Try being less specific, dumbass!"}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredDebates.map((debate) => {
                const character = characters.find(c => c.id === debate.character);
                if (!character) return null;
                
                return (
                  <div
                    key={debate.id}
                    className="relative transform hover:scale-105 transition-all cursor-pointer"
                    onClick={() => router.push(`/debate/${debate.id}`)}
                  >
                    <div className={`${character.color} p-4 sm:p-6 rounded-2xl border-4 border-black shadow-lg hover:shadow-2xl`}>
                      {/* Character Avatar */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          {getCharacterAvatar(character, 'md')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-lg sm:text-xl mb-1">{character.name}</div>
                          <div className="text-xs sm:text-sm opacity-90">{formatDate(debate.createdAt)}</div>
                        </div>
                      </div>
                      
                      {/* Topic */}
                      <div className="mb-3">
                        <div className="text-xs font-bold opacity-75 mb-1">TOPIC:</div>
                        <div className="font-bold text-sm sm:text-base line-clamp-2">{debate.topic}</div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex justify-between items-center">
                        <div className="bg-black/30 rounded px-2 py-1 text-xs font-bold">
                          💬 {debate.messageCount} messages
                        </div>
                        <button className="bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-xs font-bold transition-colors">
                          CONTINUE →
                        </button>
                      </div>
                      
                      {/* Hover decoration */}
                      <div className="absolute -top-2 -right-2 text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                        ⚔️
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats Summary */}
          {debates.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-yellow-400 to-red-500 text-black p-4 sm:p-6 rounded-2xl border-4 border-black transform -rotate-1">
              <h3 className="text-xl sm:text-2xl font-black mb-4 text-center">YOUR PATHETIC STATS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-black">{debates.length}</div>
                  <div className="text-xs sm:text-sm font-bold">Total Debates</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black">
                    {debates.reduce((sum, d) => sum + d.messageCount, 0)}
                  </div>
                  <div className="text-xs sm:text-sm font-bold">Total Messages</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black">
                    {(() => {
                      const counts = debates.reduce((acc, d) => {
                        acc[d.character] = (acc[d.character] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      const [char] = Object.entries(counts).sort(([,a], [,b]) => b - a)[0] || ['None', 0];
                      return characters.find(c => c.id === char)?.name || 'None';
                    })()}
                  </div>
                  <div className="text-xs sm:text-sm font-bold">Main Rival</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black">0%</div>
                  <div className="text-xs sm:text-sm font-bold">Win Rate</div>
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