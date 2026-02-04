'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDailyDebate } from '@/lib/daily-debates';
import Header from '@/components/Header';
import UpgradeModal from '@/components/UpgradeModal';
import { useSubscription } from '@/lib/useSubscription';

const TOPIC_EXAMPLES = [
  "Should AI be regulated?",
  "Is remote work better than office?",
  "Should college be free?",
  "Is social media harmful to society?",
];

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { isPremium, debatesUsed, debatesLimit } = useSubscription();
  const [dailyDebate, setDailyDebate] = useState<{ persona: string; topic: string; description?: string } | null>(null);
  const [topic, setTopic] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isTopicFocused, setIsTopicFocused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const topicInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus topic input on mount
  useEffect(() => {
    const debate = getDailyDebate();
    setDailyDebate(debate);
    
    // Small delay for smooth animation
    const timer = setTimeout(() => {
      topicInputRef.current?.focus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % TOPIC_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle pending debate from sign-in redirect
  useEffect(() => {
    if (!isSignedIn || !dailyDebate) return;
    
    const pendingDebateStr = sessionStorage.getItem('pendingDebate');
    if (!pendingDebateStr) return;
    
    try {
      const pendingDebate = JSON.parse(pendingDebateStr);
      if (pendingDebate.fromLandingPage) {
        sessionStorage.removeItem('pendingDebate');
        setTopic(pendingDebate.topic);
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
              }
              setIsStarting(false);
            }
          } catch (error) {
            console.error('Error creating pending debate:', error);
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

  const startDebate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || !userInput.trim()) return;
    
    if (!isSignedIn) {
      sessionStorage.setItem('pendingDebate', JSON.stringify({
        userInput,
        topic: topic.trim(),
        persona: 'Devil\'s Advocate',
        fromLandingPage: true
      }));
      openSignIn({ afterSignInUrl: '/' });
      return;
    }
    
    setIsStarting(true);
    const debateId = crypto.randomUUID();
    
    try {
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: 'custom',
          opponentStyle: 'Devil\'s Advocate',
          topic: topic.trim(),
          debateId
        })
      });
      
      if (response.ok) {
        sessionStorage.setItem('firstArgument', userInput);
        sessionStorage.setItem('isInstantDebate', 'true');
        router.push(`/debate/${debateId}`);
      } else {
        const error = await response.json();
        if (response.status === 429 && error.error === 'debate_limit_exceeded') {
          setShowUpgradeModal(true);
        }
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Error starting debate:', error);
      setIsStarting(false);
    }
  };

  const startDailyDebate = async () => {
    if (!dailyDebate) return;
    router.push('/debate');
  };

  const charCount = userInput.length;
  const maxChars = 2000;
  const canStart = topic.trim() && userInput.trim() && !isStarting;
  const showArgumentInput = topic.trim().length > 0;

  return (
    <div className="min-h-dvh flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        <div className="w-full max-w-2xl">
          
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-up">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[var(--text)] mb-4 leading-tight">
              The AI that fights back.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              Pick any topic. Defend your beliefs. See if you can win.
            </p>
          </div>

          {/* Quick Start Options */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 animate-fade-up delay-100">
            <button
              onClick={startDailyDebate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]/30 text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]/50 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Quick Start — Today&apos;s Topic
            </button>
            
            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]/30 text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border)]/50 transition-all duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Continue a Debate
            </Link>
          </div>

          <div className="relative mb-6 animate-fade-up delay-150">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs text-[var(--text-tertiary)] bg-[var(--bg)]">
                or start your own
              </span>
            </div>
          </div>

          {/* Main Input Form */}
          <form onSubmit={startDebate} className="animate-fade-up delay-200 space-y-4">
            {/* Topic Input */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent-light)]/20 rounded-2xl blur-lg opacity-50" />
              <div 
                className={`
                  relative artistic-card transition-all duration-300
                  ${isTopicFocused ? 'shadow-[0_0_40px_-10px_rgba(201,102,74,0.3)]' : ''}
                `}
              >
                <div className="px-5 py-4">
                  <label className="block text-[10px] font-medium text-[var(--accent)] uppercase tracking-[0.2em] mb-2">
                    What do you want to debate?
                  </label>
                  <input
                    ref={topicInputRef}
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onFocus={() => setIsTopicFocused(true)}
                    onBlur={() => setIsTopicFocused(false)}
                    placeholder={`Try: ${TOPIC_EXAMPLES[exampleIndex]}`}
                    className="w-full bg-transparent outline-none text-[var(--text)] placeholder-[var(--text-tertiary)] text-lg font-medium"
                    disabled={isStarting}
                  />
                </div>
              </div>
            </div>

            {/* Argument Input - Progressive Disclosure */}
            <div 
              className={`
                relative transition-all duration-500 ease-out
                ${showArgumentInput 
                  ? 'opacity-100 translate-y-0 max-h-[500px]' 
                  : 'opacity-0 translate-y-4 max-h-0 overflow-hidden pointer-events-none'
                }
              `}
            >
              <div 
                className={`
                  relative artistic-card transition-all duration-300
                  ${isInputFocused ? 'shadow-[0_0_30px_-10px_rgba(201,102,74,0.2)]' : ''}
                `}
              >
                <div className="px-5 py-4">
                  <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.15em] mb-2">
                    What&apos;s your stance?
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => {
                      if (e.target.value.length <= maxChars) {
                        setUserInput(e.target.value);
                      }
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="Make your opening argument..."
                    className="w-full bg-transparent resize-none outline-none text-[var(--text)] placeholder-[var(--text-tertiary)] min-h-[80px] text-[15px] leading-relaxed"
                    disabled={isStarting}
                  />
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]/20">
                    <span className={`text-[10px] font-mono transition-colors ${charCount > maxChars * 0.9 ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'}`}>
                      {charCount} / {maxChars}
                    </span>
                    
                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)]/50 border border-[var(--border)]/30 text-[9px] font-mono">⌘</kbd>
                      <span>+</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)]/50 border border-[var(--border)]/30 text-[9px] font-mono">Enter</kbd>
                      <span>to submit</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button - Show when argument input visible */}
            <div 
              className={`
                transition-all duration-500 ease-out
                ${showArgumentInput 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'
                }
              `}
            >
              <button
                type="submit"
                disabled={!canStart}
                className={`
                  w-full h-12 px-6 rounded-xl font-medium text-base transition-all duration-300 flex items-center justify-center gap-2
                  ${canStart
                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 hover:shadow-xl hover:shadow-[var(--accent)]/40 hover:-translate-y-0.5'
                    : 'bg-[var(--bg-sunken)] text-[var(--text-tertiary)] cursor-not-allowed'
                  }
                `}
              >
                {isStarting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span>Start Your Challenge</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </>
                )}
              </button>
              
              {/* Sign-in hint */}
              {!isSignedIn && (
                <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
                  We&apos;ll save your debate after you sign in — takes 10 seconds
                </p>
              )}
            </div>
          </form>

          {/* Upgrade Nudge */}
          {!isPremium && debatesUsed !== undefined && debatesUsed >= 2 && (
            <div className="mt-10 text-center animate-fade-in">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-[var(--accent)] bg-[var(--accent)]/5 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>
                  {debatesLimit && debatesUsed >= debatesLimit 
                    ? 'Limit reached — Upgrade'
                    : `${debatesLimit ? debatesLimit - debatesUsed : 0} debates left — Upgrade`
                  }
                </span>
              </button>
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link href="/history" className="hover:text-[var(--text)] transition-colors">
              History
            </Link>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <Link href="/debate" className="hover:text-[var(--text)] transition-colors">
              Advanced Setup
            </Link>
          </div>
        </div>
      </main>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="button"
      />
    </div>
  );
}
