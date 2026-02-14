'use client';

import React from 'react';

export default function ArenaBattlePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-32">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Arena Mode</h1>
        <div className="bg-slate-800 px-3 py-1 rounded-full text-sm">Turn 1</div>
      </header>
      
      {/* Battle Area */}
      <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto gap-8 mb-8">
        {/* Player */}
        <div className="flex flex-col items-center w-full md:w-1/3">
          <div className="relative">
            <div className="w-32 h-32 bg-blue-500 rounded-full mb-4 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/20">
              👤
            </div>
            {/* Status Effects Container */}
            <div className="absolute -top-2 -right-2 flex gap-1">
               {/* Placeholders */}
            </div>
          </div>
          
          <div className="text-xl font-bold mb-1">You</div>
          
          {/* Health Bar */}
          <div className="w-full bg-slate-800 h-6 rounded-full mt-2 overflow-hidden relative border border-slate-700">
            <div className="bg-green-500 h-full w-full transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold shadow-black drop-shadow-md">
              100 / 100
            </div>
          </div>
        </div>

        {/* VS / Info */}
        <div className="flex flex-col items-center">
          <div className="text-4xl font-black text-slate-700 mb-2">VS</div>
          <div className="text-yellow-500 font-mono font-bold text-xl">0 COMBO</div>
        </div>

        {/* AI */}
        <div className="flex flex-col items-center w-full md:w-1/3">
           <div className="relative">
            <div className="w-32 h-32 bg-red-500 rounded-full mb-4 flex items-center justify-center text-4xl shadow-lg shadow-red-500/20">
              🤖
            </div>
          </div>
          <div className="text-xl font-bold mb-1">Claude 3.5</div>
          <div className="w-full bg-slate-800 h-6 rounded-full mt-2 overflow-hidden relative border border-slate-700">
            <div className="bg-red-500 h-full w-full transition-all duration-500"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold shadow-black drop-shadow-md">
              100 / 100
            </div>
          </div>
        </div>
      </div>

      {/* Action Log */}
      <div className="max-w-2xl mx-auto mb-8 bg-slate-900/50 p-4 rounded-lg border border-slate-800 h-32 overflow-y-auto font-mono text-sm">
        <div className="text-slate-400">&gt; Match started!</div>
        <div className="text-blue-400">&gt; You entered the arena.</div>
        <div className="text-red-400">&gt; Claude 3.5 is preparing to argue...</div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-800 safe-area-pb">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-3">
          <button className="bg-gradient-to-b from-red-500 to-red-700 p-4 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-900/20 flex flex-col items-center gap-1 border-t border-white/10">
            <span className="text-2xl">⚔️</span>
            <span className="text-xs uppercase tracking-wider">Attack</span>
          </button>
          
          <button className="bg-gradient-to-b from-blue-500 to-blue-700 p-4 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-900/20 flex flex-col items-center gap-1 border-t border-white/10">
            <span className="text-2xl">🛡️</span>
            <span className="text-xs uppercase tracking-wider">Defend</span>
          </button>
          
          <button className="bg-gradient-to-b from-green-500 to-green-700 p-4 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-900/20 flex flex-col items-center gap-1 border-t border-white/10">
            <span className="text-2xl">💚</span>
            <span className="text-xs uppercase tracking-wider">Heal</span>
          </button>
          
          <button className="bg-gradient-to-b from-purple-500 to-purple-700 p-4 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-900/20 flex flex-col items-center gap-1 border-t border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            <span className="text-2xl relative z-10">✨</span>
            <span className="text-xs uppercase tracking-wider relative z-10">Ult</span>
          </button>
        </div>
      </div>
    </div>
  );
}
