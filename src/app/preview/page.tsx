'use client';

import { useState } from 'react';
import Link from 'next/link';

const mockDailyDebate = {
  topic: "Should AI systems be granted legal personhood?",
  persona: "Constitutional Lawyer",
};

export default function PreviewHome() {
  const [userInput, setUserInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/preview" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              DebateAI
            </span>
          </Link>
          
          <nav className="flex items-center gap-2">
            <Link href="/preview/debate" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              Topics
            </Link>
            <Link href="/preview/history" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              History
            </Link>
            <div className="w-px h-5 bg-white/10 mx-2" />
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-colors">
              Sign In
            </button>
          </nav>
        </div>
      </header>

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
              {mockDailyDebate.topic}
            </h1>
            
            <p className="text-lg text-zinc-400">
              Your opponent: <span className="font-medium text-white">{mockDailyDebate.persona}</span>
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
                  <Link
                    href="/preview/chat"
                    className={`px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      userInput.trim() 
                        ? 'bg-indigo-500 text-white hover:bg-indigo-400' 
                        : 'bg-white/5 text-zinc-500 pointer-events-none'
                    }`}
                  >
                    Start Debate
                    <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded">⌘↵</kbd>
                  </Link>
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
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Sharpen your critical thinking with AI
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/preview/debate" className="hover:text-white transition-colors">Browse Topics</Link>
            <Link href="#" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
