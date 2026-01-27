'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDailyDebate } from '@/lib/daily-debates';
import Header from '@/components/Header';
import UpgradeModal from '@/components/UpgradeModal';
import { useSubscription } from '@/lib/useSubscription';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { isPremium, debatesUsed, debatesLimit } = useSubscription();
  const [dailyDebate, setDailyDebate] = useState<{ persona: string; topic: string; description?: string } | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const debate = getDailyDebate();
    setDailyDebate(debate);
  }, []);

  useEffect(() => {
    if (!isSignedIn || !dailyDebate) return;
    
    const pendingDebateStr = sessionStorage.getItem('pendingDebate');
    if (!pendingDebateStr) return;
    
    try {
      const pendingDebate = JSON.parse(pendingDebateStr);
      if (pendingDebate.fromLandingPage) {
        sessionStorage.removeItem('pendingDebate');
        setUserInput(pendingDebate.userInput);
        setIsStarting(true);
        
        const createPendingDebate = async () => {
          const debateId = crypto.randomUUID();
          
          try {
            const response = await fetch('/api/debate/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                character: 'custom',
                opponentStyle: pendingDebate.persona,
                topic: pendingDebate.topic,
                debateId
              })
            });
            
            if (response.ok) {
              sessionStorage.setItem('firstArgument', pendingDebate.userInput);
              sessionStorage.setItem('isInstantDebate', 'true');
              router.push(`/debate/${debateId}`);
            } else {
              const error = await response.json();
              if (response.status === 429 && error.error === 'debate_limit_exceeded') {
                setShowUpgradeModal(true);
              } else {
                alert('Failed to start debate. Please try again.');
              }
              setIsStarting(false);
            }
          } catch (error) {
            console.error('Error creating pending debate:', error);
            alert('Failed to start debate. Please try again.');
            setIsStarting(false);
          }
        };
        
        createPendingDebate();
      }
    } catch (error) {
      console.error('Error parsing pending debate:', error);
      sessionStorage.removeItem('pendingDebate');
    }
  }, [isSignedIn, dailyDebate, router]);

  const startDebate = async () => {
    if (!userInput.trim() || !dailyDebate) return;
    
    if (!isSignedIn) {
      sessionStorage.setItem('pendingDebate', JSON.stringify({
        userInput,
        topic: dailyDebate.topic,
        persona: dailyDebate.persona,
        fromLandingPage: true
      }));
      openSignIn({ afterSignInUrl: '/' });
      return;
    }
    
    setIsStarting(true);
    const debateTopic = dailyDebate.topic;
    const firstArgument = userInput;
    const opponentStyle = dailyDebate.persona;
    const debateId = crypto.randomUUID();
    
    try {
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: 'custom',
          opponentStyle,
          topic: debateTopic,
          debateId
        })
      });
      
      if (response.ok) {
        sessionStorage.setItem('firstArgument', firstArgument);
        sessionStorage.setItem('isInstantDebate', 'true');
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 401) {
          openSignIn();
        } else {
          alert('Failed to start debate. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error starting debate:', error);
      alert('Failed to start debate. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Daily Challenge
            </div>
            
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 px-4 leading-tight tracking-tight text-white">
              {dailyDebate?.topic || 'Loading...'}
            </h1>
            
            <p className="text-lg text-zinc-400">
              Your opponent: <span className="font-medium text-white">{dailyDebate?.persona || '...'}</span>
            </p>
          </div>

          {/* Input Area */}
          <div className={`relative rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[#0a0a0b]' : ''}`}>
            <div className="rounded-2xl overflow-hidden bg-[#131316] border border-white/[0.06] shadow-2xl shadow-black/50">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    startDebate();
                  }
                }}
                placeholder="Share your opening argument..."
                className="w-full px-6 py-5 bg-transparent border-none focus:outline-none resize-none text-lg leading-relaxed text-white placeholder:text-zinc-500"
                style={{ minHeight: '140px' }}
                autoFocus
              />
              
              {/* Bottom bar */}
              <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-between border-t border-white/[0.04]">
                <span className="text-sm text-zinc-500">
                  {userInput.length > 0 ? `${userInput.length} characters` : 'Start typing...'}
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUserInput('')}
                    className={`px-4 py-2 text-sm rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors ${!userInput.trim() ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={startDebate}
                    disabled={!userInput.trim() || isStarting}
                    className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      userInput.trim() && !isStarting 
                        ? 'bg-indigo-500 text-white hover:bg-indigo-400' 
                        : 'bg-white/5 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {isStarting ? 'Starting...' : 'Start Debate'}
                    <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded">⌘↵</kbd>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>~10 min debate</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Real-time AI</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Web-sourced</span>
            </div>
          </div>

          {/* Subtle Premium Link */}
          {isSignedIn && !isPremium && debatesUsed !== undefined && debatesUsed >= 2 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {debatesLimit && debatesUsed >= debatesLimit 
                  ? 'Debate limit reached • Upgrade for unlimited'
                  : `${debatesLimit ? debatesLimit - debatesUsed : 0} free debate${debatesLimit && debatesLimit - debatesUsed === 1 ? '' : 's'} remaining`}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />

      {/* Footer */}
      <footer className="py-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Sharpen your critical thinking with AI
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/debate" className="hover:text-white transition-colors">Browse Topics</Link>
            <Link href="/history" className="hover:text-white transition-colors">History</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
