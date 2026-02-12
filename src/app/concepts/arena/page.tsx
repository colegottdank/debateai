'use client';
import { useState, useEffect } from 'react';

// Types
type Message = {
  id: string;
  sender: 'A' | 'B';
  text: string;
  damage: number;
  type: 'logic' | 'emotion' | 'fact';
};

const SAMPLE_DEBATE: Message[] = [
  { id: '1', sender: 'A', text: "Universal Basic Income is necessary because automation will displace 40% of jobs by 2035.", damage: 15, type: 'fact' },
  { id: '2', sender: 'B', text: "That projection is based on a worst-case scenario. Historically, technology creates more jobs than it destroys.", damage: 12, type: 'logic' },
  { id: '3', sender: 'A', text: "But AI is different. It replaces cognitive labor, not just physical. We need a safety net now.", damage: 18, type: 'emotion' },
  { id: '4', sender: 'B', text: "A safety net exists: retraining programs. UBI discourages work and would cause hyperinflation.", damage: 25, type: 'logic' },
  { id: '5', sender: 'A', text: "Inflation is driven by supply constraints, not velocity of money in this context. And human worth shouldn't be tied to labor.", damage: 20, type: 'emotion' },
];

export default function ArenaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [healthA, setHealthA] = useState(100);
  const [healthB, setHealthB] = useState(100);
  const [round, setRound] = useState(0);

  // Simulation effect
  useEffect(() => {
    if (round < SAMPLE_DEBATE.length) {
      const timer = setTimeout(() => {
        const msg = SAMPLE_DEBATE[round];
        setMessages(prev => [...prev, msg]);
        if (msg.sender === 'A') setHealthB(h => Math.max(0, h - msg.damage));
        else setHealthA(h => Math.max(0, h - msg.damage));
        setRound(r => r + 1);
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [round]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-2 md:p-4 font-sans overflow-x-hidden">
      {/* Header / HUD */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 md:mb-8 bg-slate-900/80 backdrop-blur-md p-3 md:p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden mt-2 md:mt-4">
        {/* Player A (Left) */}
        <div className="flex items-center gap-2 md:gap-6 z-10 w-5/12 md:w-1/3">
          <div className="relative shrink-0">
             <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-4xl shadow-lg border-2 md:border-4 border-slate-800 rotate-3 transform hover:rotate-0 transition-all cursor-pointer">
               🤖
             </div>
             <div className="hidden md:block absolute -bottom-2 -right-2 bg-blue-500 text-xs font-bold px-2 py-1 rounded-full">LVL 99</div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-sm md:text-xl text-blue-400 tracking-wider truncate">LOGIC</span>
            <div className="w-full h-3 md:h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-1 md:mt-2 relative shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 ease-out relative"
                style={{ width: `${healthA}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="hidden md:flex justify-between text-xs text-blue-300/50 mt-1 font-mono">
              <span>HP: {healthA}/100</span>
              <span>MP: 100%</span>
            </div>
          </div>
        </div>

        {/* VS Badge */}
        <div className="z-10 flex flex-col items-center shrink-0 w-2/12">
            <span className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">VS</span>
            <span className="text-[10px] md:text-xs text-yellow-500/50 font-mono tracking-widest mt-1 md:mt-2">R{Math.min(round + 1, 5)}</span>
        </div>

        {/* Player B (Right) */}
        <div className="flex items-center gap-2 md:gap-6 flex-row-reverse text-right z-10 w-5/12 md:w-1/3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-4xl shadow-lg border-2 md:border-4 border-slate-800 -rotate-3 transform hover:rotate-0 transition-all cursor-pointer">
              🧠
            </div>
             <div className="hidden md:block absolute -bottom-2 -left-2 bg-red-500 text-xs font-bold px-2 py-1 rounded-full">LVL 88</div>
          </div>
          <div className="flex flex-col items-end flex-1 min-w-0">
            <span className="font-bold text-sm md:text-xl text-red-400 tracking-wider truncate">EMPATH</span>
            <div className="w-full h-3 md:h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-1 md:mt-2 relative shadow-inner">
              <div 
                className="h-full bg-gradient-to-l from-red-600 to-orange-400 transition-all duration-700 ease-out relative"
                style={{ width: `${healthB}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="hidden md:flex justify-between text-xs text-red-300/50 mt-1 font-mono w-full">
              <span>MP: 45%</span>
              <span>HP: {healthB}/100</span>
            </div>
          </div>
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
      </div>

      {/* Battle Log (Chat) */}
      <div className="w-full max-w-4xl flex-1 overflow-y-auto space-y-6 md:space-y-8 p-2 md:p-4 relative min-h-[500px] pb-32">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.sender === 'A' ? 'justify-start' : 'justify-end'} animate-[slideIn_0.5s_ease-out]`}
          >
            <div 
              className={`
                max-w-[85%] md:max-w-[70%] p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl relative backdrop-blur-sm border
                ${msg.sender === 'A' 
                  ? 'bg-blue-950/40 border-blue-500/30 rounded-tl-sm text-blue-50' 
                  : 'bg-red-950/40 border-red-500/30 rounded-tr-sm text-red-50'
                }
              `}
            >
              <p className="text-base md:text-xl leading-relaxed font-medium">{msg.text}</p>
              
              {/* Damage Floater - Optimized for Mobile */}
              <div className={`
                absolute -top-3 md:-top-4 ${msg.sender === 'A' ? 'right-0 md:-right-12 translate-x-1/2 md:translate-x-0' : 'left-0 md:-left-12 -translate-x-1/2 md:translate-x-0'} 
                flex flex-col items-center animate-[bounce_1s_infinite] z-20
              `}>
                <span className={`
                    text-lg md:text-2xl font-black drop-shadow-lg
                    ${msg.type === 'logic' ? 'text-purple-400' : msg.type === 'fact' ? 'text-green-400' : 'text-orange-400'}
                    bg-slate-900/80 px-1 rounded
                `}>
                    -{msg.damage}
                </span>
                <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest opacity-80 bg-black/50 px-2 rounded hidden md:block">
                    {msg.type} HIT
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col opacity-30 pointer-events-none">
            <div className="text-6xl animate-pulse">⚔️</div>
            <div className="mt-4 text-xl font-mono text-center">INITIALIZING BATTLE...</div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-8 flex gap-4 z-50">
        <button 
          onClick={() => { setMessages([]); setHealthA(100); setHealthB(100); setRound(0); }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-full text-sm font-bold border border-slate-700 hover:border-slate-500 transition-all shadow-lg active:scale-95 backdrop-blur-md"
        >
          ↻ RESTART MATCH
        </button>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
