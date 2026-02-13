'use client';

import React from 'react';
import Link from 'next/link';

export default function ArenaSummaryPage() {
  // Mock result
  const result = {
    outcome: 'VICTORY',
    xp: 450,
    stats: [
      { label: 'Logic Accuracy', value: '92%', score: 92 },
      { label: 'Rhetoric Style', value: '88%', score: 88 },
      { label: 'Response Time', value: '1.2s', score: 95 },
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-2xl">
            VICTORY
          </h1>
          <p className="text-slate-400 mt-2 font-mono uppercase tracking-widest">Opponent Defeated</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-yellow-500/10 relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-yellow-500/20 blur-3xl rounded-full"></div>

          <div className="flex flex-col gap-4 mb-8">
            {result.stats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{stat.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full" 
                      style={{ width: `${stat.score}%` }}
                    />
                  </div>
                  <span className="font-bold text-white w-12 text-right">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 rounded-xl p-4 text-center border border-slate-800 mb-6">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Reward</div>
            <div className="text-4xl font-black text-yellow-400">+{result.xp} XP</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/arena" 
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-center font-bold transition-colors"
            >
              Return
            </Link>
            <Link 
              href="/arena/battle" 
              className="py-3 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-center font-bold transition-colors"
            >
              Play Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
