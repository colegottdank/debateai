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

  // Load daily debate pairing on mount
  useEffect(() => {
    const debate = getDailyDebate();
    setDailyDebate(debate);
  }, []);

  // Check for pending debate after sign-in
  useEffect(() => {
    if (!isSignedIn || !dailyDebate) return;
    
    const pendingDebateStr = sessionStorage.getItem('pendingDebate');
    if (!pendingDebateStr) return;
    
    try {
      const pendingDebate = JSON.parse(pendingDebateStr);
      if (pendingDebate.fromLandingPage) {
        // Clear the pending debate data
        sessionStorage.removeItem('pendingDebate');
        
        // Set the user input and start the debate
        setUserInput(pendingDebate.userInput);
        setIsStarting(true);
        
        // Create the debate immediately
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
              // Store first argument for the debate page to use
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

  const resetToDaily = () => {
    setUserInput('');
  };


  const startDebate = async () => {
    if (!userInput.trim() || !dailyDebate) return;
    
    // Check if user is signed in first
    if (!isSignedIn) {
      // Store debate data before opening sign-in
      sessionStorage.setItem('pendingDebate', JSON.stringify({
        userInput,
        topic: dailyDebate.topic,
        persona: dailyDebate.persona,
        fromLandingPage: true
      }));
      // Use afterSignInUrl to return to landing page
      openSignIn({ afterSignInUrl: '/' });
      return;
    }
    
    setIsStarting(true);
    
    // Always use daily debate topic from homepage
    const debateTopic = dailyDebate.topic;
    const firstArgument = userInput;
    const opponentStyle = dailyDebate.persona; // Always use today's persona
    
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
        // Store first argument in sessionStorage instead of URL
        sessionStorage.setItem('firstArgument', firstArgument);
        sessionStorage.setItem('isInstantDebate', 'true');
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 401) {
          // This shouldn't happen now, but keep as fallback
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          {/* Topic Display */}
          <div className="mb-12 text-center">
            <p className="text-slate-500 text-sm mb-2 uppercase tracking-wider">Today's Debate</p>
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              {dailyDebate?.topic || 'Loading...'}
            </h2>
            <p className="text-slate-400 text-lg">
              Debating against: <span className="text-slate-100 font-medium">{dailyDebate?.persona || '...'}</span>
            </p>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  startDebate();
                }
              }}
              placeholder="Type your position on this topic..."
              className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-32 text-slate-100 placeholder-slate-500 transition-colors"
              autoFocus
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={startDebate}
                disabled={!userInput.trim() || isStarting}
                className={`flex-1 py-3 px-6 font-medium rounded-lg transition-all ${
                  userInput.trim() && !isStarting
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? 'Starting...' : 'Start Debate'}
              </button>
              
              <button
                onClick={resetToDaily}
                className="py-3 px-6 font-medium rounded-lg bg-transparent border border-slate-700 text-slate-100 hover:bg-slate-800 transition-all"
                title="Reset to today's question"
              >
                Reset
              </button>
            </div>

            {/* Helper Text */}
            <div className="text-center">
              <p className="text-slate-400 text-sm">
                Responding to the topic above
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Press ⌘+Enter to start
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-16 flex items-center justify-center gap-6">
            <Link href="/debate" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Advanced Setup
            </Link>
            <span className="text-slate-600">•</span>
            <Link href="/history" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Previous Debates
            </Link>
          </div>

          {/* Subtle Premium Link for Free Users */}
          {isSignedIn && !isPremium && debatesUsed !== undefined && debatesUsed >= 2 && (
            <div className="mt-12 text-center">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {debatesLimit && debatesUsed >= debatesLimit 
                  ? 'Debate limit reached • Upgrade for unlimited'
                  : `${debatesLimit ? debatesLimit - debatesUsed : 0} free debate${debatesLimit && debatesLimit - debatesUsed === 1 ? '' : 's'} remaining • Upgrade`}
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

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs">
            Sharpen your argumentation skills with AI
          </p>
        </div>
      </footer>
    </div>
  );
}