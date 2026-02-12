'use client';
import { useState, useEffect } from 'react';

type Message = {
  id: string;
  sender: 'A' | 'B';
  text: string;
  damage: number;
  timestamp: string;
};

const SAMPLE_DEBATE: Message[] = [
  { id: '0x1A', sender: 'A', text: "Universal Basic Income is necessary because automation will displace 40% of jobs by 2035.", damage: 15, timestamp: "14:02:01.452" },
  { id: '0x1B', sender: 'B', text: "That projection is based on a worst-case scenario. Historically, technology creates more jobs than it destroys.", damage: 12, timestamp: "14:02:03.112" },
  { id: '0x2A', sender: 'A', text: "But AI is different. It replaces cognitive labor, not just physical. We need a safety net now.", damage: 18, timestamp: "14:02:05.891" },
  { id: '0x2B', sender: 'B', text: "A safety net exists: retraining programs. UBI discourages work and would cause hyperinflation.", damage: 25, timestamp: "14:02:09.221" },
  { id: '0x3A', sender: 'A', text: "Inflation is driven by supply constraints, not velocity of money in this context. And human worth shouldn't be tied to labor.", damage: 20, timestamp: "14:02:12.443" },
];

export default function StreamPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (round < SAMPLE_DEBATE.length) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, SAMPLE_DEBATE[round]]);
        setRound(r => r + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [round]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-2 md:p-8 overflow-x-hidden pb-32">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-green-900 z-50">
         <div className="h-full bg-green-400 animate-[progress_2s_infinite]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 mt-8 md:mt-12 relative">
         
         {/* Center Divider (Desktop) */}
         <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-green-900/50 -translate-x-1/2"></div>

         {/* Stream A */}
         <div className="space-y-4">
            <div className="sticky top-4 bg-black/90 backdrop-blur z-10 pb-4 border-b border-green-800">
               <h2 className="text-xl md:text-2xl font-bold text-green-400">&gt;&gt; NODE_ALPHA</h2>
               <div className="text-xs opacity-50">STATUS: CONNECTED | LATENCY: 12ms</div>
            </div>
            
            {messages.filter(m => m.sender === 'A').map(m => (
               <div key={m.id} className="group relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-400 transition-colors"></div>
                  <div className="pl-4 py-2">
                     <div className="flex items-center gap-2 text-xs opacity-50 mb-1">
                        <span>[{m.timestamp}]</span>
                        <span>ID: {m.id}</span>
                     </div>
                     <p className="text-sm md:text-base leading-relaxed text-green-300 group-hover:text-green-100 transition-colors">
                        {m.text}
                     </p>
                     <div className="mt-2 text-xs font-bold bg-green-900/30 inline-block px-2 py-1 rounded">
                        CONFIDENCE: {(0.8 + Math.random() * 0.2).toFixed(4)}
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Stream B */}
         <div className="space-y-4 md:text-right mt-8 md:mt-0">
            <div className="sticky top-4 bg-black/90 backdrop-blur z-10 pb-4 border-b border-green-800">
               <h2 className="text-xl md:text-2xl font-bold text-green-400">NODE_BETA &lt;&lt;</h2>
               <div className="text-xs opacity-50">STATUS: CONNECTED | LATENCY: 14ms</div>
            </div>

            {messages.filter(m => m.sender === 'B').map(m => (
               <div key={m.id} className="group relative flex flex-col md:items-end">
                  <div className="absolute left-0 md:left-auto md:right-0 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-400 transition-colors"></div>
                  <div className="pl-4 md:pl-0 md:pr-4 py-2">
                     <div className="flex items-center gap-2 text-xs opacity-50 mb-1 md:justify-end">
                        <span>ID: {m.id}</span>
                        <span>[{m.timestamp}]</span>
                     </div>
                     <p className="text-sm md:text-base leading-relaxed text-green-300 group-hover:text-green-100 transition-colors">
                        {m.text}
                     </p>
                     <div className="mt-2 text-xs font-bold bg-green-900/30 inline-block px-2 py-1 rounded">
                        CONFIDENCE: {(0.8 + Math.random() * 0.2).toFixed(4)}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="fixed bottom-8 right-8">
        <button 
           onClick={() => { setMessages([]); setRound(0); }}
           className="bg-green-900/50 hover:bg-green-900 text-green-400 border border-green-500 px-4 py-2 text-xs font-mono tracking-widest uppercase"
        >
           [ RESET_CONNECTION ]
        </button>
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; opacity: 1; }
          50% { width: 100%; opacity: 0.5; }
          100% { width: 0%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
