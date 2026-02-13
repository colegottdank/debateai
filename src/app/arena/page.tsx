import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arena Mode - DebateAI',
  description: 'Enter the arena.',
};

export default function ArenaPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-mono">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0" />
      
      {/* HUD Layer */}
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 flex flex-col h-screen">
        
        {/* Health Bars */}
        <div className="flex justify-between items-center w-full mb-8 pt-4 gap-8">
          {/* Player 1 */}
          <div className="flex-1 flex flex-col relative">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xl font-bold text-yellow-400 drop-shadow-lg tracking-widest">CLAUDE 3.5</span>
              <span className="text-sm text-gray-400">Lv. 99</span>
            </div>
            <div className="h-6 w-full bg-gray-800 border-2 border-gray-600 relative skew-x-[-12deg]">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 w-[80%] transition-all duration-300" />
            </div>
            <div className="absolute -bottom-8 left-0 flex gap-2">
               <div className="w-12 h-12 bg-blue-500 rounded-full border-2 border-white overflow-hidden">
                 {/* Avatar Placeholder */}
                 <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs">P1</div>
               </div>
            </div>
          </div>

          {/* VS / Timer */}
          <div className="flex flex-col items-center justify-center w-24 shrink-0">
             <div className="text-4xl font-black text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] italic">VS</div>
             <div className="text-lg font-bold text-white mt-1">99</div>
          </div>

          {/* Player 2 */}
          <div className="flex-1 flex flex-col items-end relative">
            <div className="flex justify-between items-end mb-1 w-full flex-row-reverse">
              <span className="text-xl font-bold text-red-400 drop-shadow-lg tracking-widest">GPT-4o</span>
              <span className="text-sm text-gray-400">Lv. 100</span>
            </div>
            <div className="h-6 w-full bg-gray-800 border-2 border-gray-600 relative skew-x-[12deg]">
              <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 to-red-400 w-[60%] transition-all duration-300" />
            </div>
             <div className="absolute -bottom-8 right-0 flex gap-2">
               <div className="w-12 h-12 bg-red-500 rounded-full border-2 border-white overflow-hidden">
                 {/* Avatar Placeholder */}
                 <div className="w-full h-full bg-red-600 flex items-center justify-center text-xs">P2</div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex items-center justify-center relative my-8">
           {/* Characters would be here */}
           <div className="flex justify-between w-full px-12 items-end h-full">
              <div className="w-32 h-64 bg-blue-500/20 border border-blue-500/50 flex items-center justify-center animate-pulse">
                <span className="text-blue-400 font-bold">IDLE</span>
              </div>
              
              {/* Damage Float */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-red-500 drop-shadow-lg animate-bounce hidden">
                 -450
              </div>

              <div className="w-32 h-64 bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                 <span className="text-red-400 font-bold">HIT!</span>
              </div>
           </div>
           
           {/* Combo Counter */}
           <div className="absolute left-8 top-1/4">
              <div className="text-5xl font-black text-orange-500 italic drop-shadow-[0_4px_0_rgba(0,0,0,1)] animate-bounce">
                3 HIT COMBO!
              </div>
           </div>
        </div>

        {/* Text / Dialogue Area */}
        <div className="h-48 w-full bg-gray-900/90 border-t-4 border-white/20 p-6 backdrop-blur-sm rounded-t-xl">
           <div className="text-yellow-400 font-bold mb-2 uppercase tracking-wide">Claude 3.5 is arguing...</div>
           <p className="text-xl text-white leading-relaxed font-medium">
             &quot;Your logic is flawed because the premise assumes a static environment, whereas the variable factors clearly indicate a dynamic shift in user behavior...&quot;
           </p>
        </div>
      </div>
    </div>
  );
}
