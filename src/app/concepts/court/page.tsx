'use client';
import { useState, useEffect } from 'react';

type Message = {
  id: string;
  sender: 'A' | 'B';
  text: string;
};

const SAMPLE_DEBATE: Message[] = [
  { id: '1', sender: 'A', text: "Your Honor, the prosecution asserts that Universal Basic Income is an inevitability given the rapid automation of labor." },
  { id: '2', sender: 'B', text: "Objection! Speculation. The defense argues that technology has historically created new sectors of employment we cannot yet foresee." },
  { id: '3', sender: 'A', text: "Overruled. Proceed with the evidence regarding cognitive automation." },
  { id: '4', sender: 'A', text: "Unlike the Industrial Revolution, AI replaces the mind, not the muscle. Where will humans retreat to when thought itself is commoditized?" },
  { id: '5', sender: 'B', text: "To creativity, empathy, and leadership. Attributes no machine possesses genuinely." },
];

export default function CourtPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (round < SAMPLE_DEBATE.length) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, SAMPLE_DEBATE[round]]);
        setRound(r => r + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [round]);

  return (
    <div className="min-h-screen bg-[#2c1810] text-[#e8dcc5] font-serif p-4 flex flex-col items-center relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>

      {/* Judge Bench */}
      <div className="w-full max-w-3xl bg-[#4a2c20] h-24 md:h-32 rounded-b-[3rem] flex items-center justify-center shadow-2xl relative z-10 border-b-8 border-[#1a0f0a]">
        <div className="absolute -bottom-12 md:-bottom-16 w-24 h-24 md:w-32 md:h-32 bg-[#e8dcc5] rounded-full flex items-center justify-center text-5xl md:text-6xl border-8 border-[#4a2c20] shadow-lg">
           ⚖️
        </div>
        <div className="text-lg md:text-2xl font-bold uppercase tracking-[0.2em] text-[#d4b483] mt-[-20px] shadow-black drop-shadow-md">High Court of Logic</div>
      </div>

      {/* Stands */}
      <div className="w-full max-w-6xl mt-16 md:mt-24 flex justify-between px-2 md:px-12 relative z-0">
        <div className="flex flex-col items-center transform -rotate-2">
           <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-900 rounded-t-full border-4 border-[#4a2c20] shadow-lg flex items-center justify-center text-3xl">👨‍⚖️</div>
           <div className="bg-[#4a2c20] px-4 md:px-6 py-2 rounded-lg shadow-xl font-bold border border-[#6b4230] text-xs md:text-base mt-[-10px] z-10">PROSECUTION</div>
        </div>
        <div className="flex flex-col items-center transform rotate-2">
           <div className="w-16 h-16 md:w-24 md:h-24 bg-red-900 rounded-t-full border-4 border-[#4a2c20] shadow-lg flex items-center justify-center text-3xl">👩‍⚖️</div>
           <div className="bg-[#4a2c20] px-4 md:px-6 py-2 rounded-lg shadow-xl font-bold border border-[#6b4230] text-xs md:text-base mt-[-10px] z-10">DEFENSE</div>
        </div>
      </div>

      {/* Transcript (Scroll) */}
      <div className="flex-1 w-full max-w-2xl mt-8 bg-[#f5f0e6] text-black p-6 md:p-12 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-y-auto font-serif leading-relaxed relative mb-24 rotate-[-1deg] hover:rotate-0 transition-transform duration-500 border border-[#d4c5b0]">
         {/* Paper Texture Overlay */}
         <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>
         
         <div className="text-center font-bold border-b-2 border-black pb-4 mb-8 uppercase tracking-widest text-xs md:text-sm opacity-50">
            Case No. 2026-UBI-AI • Transcript of Proceedings
         </div>

         {messages.map((m) => (
            <div key={m.id} className={`mb-6 md:mb-8 ${m.sender === 'A' ? 'mr-8 md:mr-12' : 'ml-8 md:ml-12 text-right'}`}>
               <span className={`font-bold uppercase text-[10px] md:text-xs tracking-wider mb-1 block opacity-70 ${m.sender === 'A' ? 'text-blue-900' : 'text-red-900'}`}>
                  {m.sender === 'A' ? 'The Prosecution' : 'The Defense'}
               </span>
               <p className={`text-base md:text-xl relative ${m.sender === 'A' ? '' : ''}`}>
                  {m.sender === 'A' ? '“' : ''}{m.text}{m.sender === 'B' ? '”' : '”'}
               </p>
            </div>
         ))}
         
         {messages.length === 0 && (
            <div className="text-center italic opacity-50 mt-12">The court is now in session.</div>
         )}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-8 flex gap-4 z-50">
        <button 
          onClick={() => { setMessages([]); setRound(0); }}
          className="bg-[#4a2c20] hover:bg-[#5c3829] text-[#e8dcc5] px-8 py-3 rounded shadow-xl font-bold border border-[#6b4230] uppercase tracking-widest text-xs"
        >
          New Trial
        </button>
      </div>
    </div>
  );
}
