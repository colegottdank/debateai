'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UpgradeModal from '@/components/UpgradeModal';
import Header from '@/components/Header';

export default function DebatePage() {
  const { user } = useUser();
  const router = useRouter();
  const [opponentStyle, setOpponentStyle] = useState('');
  const [topic, setTopic] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    trigger: 'rate-limit-debate' | 'rate-limit-message' | 'button';
    limitData?: {
      current: number;
      limit: number;
    };
  }>({
    isOpen: false,
    trigger: 'button'
  });

  const startDebate = async () => {
    if (!opponentStyle.trim() || !topic.trim()) {
      return;
    }
    
    setIsStarting(true);
    const debateId = crypto.randomUUID();
    
    try {
      // Create debate in database
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: 'custom',
          opponentStyle,
          topic,
          debateId
        })
      });
      
      if (response.ok) {
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        console.error('Failed to create debate:', error);
        
        // Handle rate limit error
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setUpgradeModal({
            isOpen: true,
            trigger: 'rate-limit-debate',
            limitData: {
              current: error.current,
              limit: error.limit
            }
          });
        } else if (response.status === 401) {
          alert('Please sign in to start a debate');
        } else {
          alert('Failed to create debate. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating debate:', error);
      alert('Failed to create debate. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal(prev => ({ ...prev, isOpen: false }))}
        trigger={upgradeModal.trigger}
        limitData={upgradeModal.limitData}
      />
      
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Debate Setup</h1>
            <p className="text-slate-400">Configure your debate opponent and topic</p>
          </div>

          {/* Configuration Form */}
          <div className="space-y-6">
            {/* Opponent Style */}
            <div>
              <label htmlFor="opponent" className="block text-sm font-medium text-slate-400 mb-2">
                Opponent Style or Person
              </label>
              <textarea
                id="opponent"
                value={opponentStyle}
                onChange={(e) => setOpponentStyle(e.target.value)}
                placeholder="Describe your opponent's style OR name a specific person (e.g., 'Elon Musk', 'Jordan Peterson', 'AOC', or 'aggressive and confrontational', 'philosophical and questioning')"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-24 text-slate-100 placeholder-slate-500 transition-colors"
              />
            </div>

            {/* Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-400 mb-2">
                Debate Topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    startDebate();
                  }
                }}
                placeholder="What do you want to debate about?"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-24 text-slate-100 placeholder-slate-500 transition-colors"
              />
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <button
                onClick={startDebate}
                disabled={!opponentStyle.trim() || !topic.trim() || isStarting}
                className={`w-full py-3 px-6 font-medium rounded-lg transition-all ${
                  opponentStyle.trim() && topic.trim() && !isStarting
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? 'Starting...' : 'Start Debate'}
              </button>
              
              <p className="text-center text-slate-500 text-xs mt-3">
                Press ⌘+Enter to start
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-16 flex justify-center gap-6">
            <Link href="/" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Quick Start
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/history" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Previous Debates
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}