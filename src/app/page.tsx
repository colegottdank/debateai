'use client';

import { useState, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getDailyQuestion } from '@/lib/debate-topics';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [currentTopic, setCurrentTopic] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isCustomTopic, setIsCustomTopic] = useState(false);

  // Load daily topic on mount
  useEffect(() => {
    const dailyTopic = getDailyQuestion();
    setCurrentTopic(dailyTopic);
  }, []);

  const resetToDaily = () => {
    const dailyTopic = getDailyQuestion();
    setCurrentTopic(dailyTopic);
    setUserInput('');
    setIsCustomTopic(false);
  };

  const handleInputChange = (value: string) => {
    setUserInput(value);
    
    // Check if user is typing something unrelated to the prompt
    if (value.length > 20) {
      const topicWords = currentTopic.toLowerCase().split(' ');
      const inputWords = value.toLowerCase().split(' ');
      const hasOverlap = topicWords.some(word => 
        word.length > 3 && inputWords.some(inputWord => inputWord.includes(word))
      );
      
      setIsCustomTopic(!hasOverlap);
    }
  };

  const startDebate = async () => {
    if (!userInput.trim()) return;
    
    setIsStarting(true);
    
    // Determine the actual topic
    const debateTopic = isCustomTopic ? userInput : currentTopic;
    const firstArgument = isCustomTopic ? userInput : userInput;
    
    // Auto-select opponent based on topic
    let opponent = 'logical';
    const topicLower = debateTopic.toLowerCase();
    
    if (topicLower.includes('ethic') || topicLower.includes('moral') || topicLower.includes('right') || topicLower.includes('wrong')) {
      opponent = 'socratic';
    } else if (topicLower.includes('practical') || topicLower.includes('implement') || topicLower.includes('real')) {
      opponent = 'pragmatist';
    } else if (topicLower.includes('research') || topicLower.includes('study') || topicLower.includes('science')) {
      opponent = 'academic';
    } else if (userInput.toLowerCase().includes('disagree') || userInput.toLowerCase().includes('wrong')) {
      opponent = 'devils_advocate';
    }
    
    const debateId = crypto.randomUUID();
    
    try {
      const response = await fetch('/api/debate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: opponent,
          topic: debateTopic,
          debateId
        })
      });
      
      if (response.ok) {
        router.push(`/debate/${debateId}?instant=true&firstArg=${encodeURIComponent(firstArgument)}`);
      } else {
        const error = await response.json();
        if (response.status === 401) {
          alert('Please sign in to start a debate');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-medium text-slate-100">DebateAI</h1>
            <nav className="flex items-center gap-4">
              <SignedIn>
                <a href="/history" className="text-slate-400 hover:text-slate-100 transition-colors text-sm">
                  History
                </a>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-slate-100 hover:text-slate-200 transition-colors text-sm">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          {/* Topic Display */}
          <div className="mb-12 text-center">
            <p className="text-slate-500 text-sm mb-4 uppercase tracking-wider">Today's Question</p>
            <h2 className="topic-display">
              {currentTopic}
            </h2>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            <textarea
              value={userInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  startDebate();
                }
              }}
              placeholder={isCustomTopic 
                ? "Enter your own debate topic..." 
                : "Type your position on this topic..."}
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
                {isCustomTopic 
                  ? "Writing your own topic" 
                  : "Responding to the topic above"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Press ⌘+Enter to start
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-16 flex justify-center gap-6">
            <a href="/debate" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Advanced Setup
            </a>
            <span className="text-slate-600">•</span>
            <a href="/history" className="text-slate-500 hover:text-slate-100 text-sm transition-colors">
              Previous Debates
            </a>
          </div>
        </div>
      </main>

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