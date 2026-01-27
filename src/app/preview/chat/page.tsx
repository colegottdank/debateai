'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const mockDebate = {
  topic: "Should AI systems be granted legal personhood?",
  opponent: "Constitutional Lawyer",
};

const mockMessages = [
  {
    role: 'user',
    content: "I believe AI systems should eventually be granted some form of legal personhood, especially as they become more sophisticated. We already grant personhood to corporations, which are legal fictions. Why not extend similar protections to AI systems that demonstrate autonomous decision-making?",
  },
  {
    role: 'ai',
    content: "While I appreciate the creative thinking, the corporation analogy actually undermines your argument. Corporations are granted legal personhood precisely because they're composed of humans who bear ultimate responsibility.\n\nThe key distinction is accountability. When a corporation causes harm, we can trace responsibility to human decision-makers - executives, board members, shareholders. With AI, who bears responsibility when it makes a harmful autonomous decision?\n\nMoreover, legal personhood has historically been tied to the capacity for moral reasoning and the ability to understand rights and obligations. Can an AI truly comprehend what it means to have duties to society?",
  },
  {
    role: 'user',
    content: "That's a fair point about accountability. But consider this: as AI systems become more autonomous, the traditional chain of human responsibility becomes increasingly tenuous.",
  },
];

export default function PreviewChat() {
  const [messages, setMessages] = useState(mockMessages);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!userInput.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);
    setUserInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "That's an intriguing perspective that touches on the evolving nature of agency and responsibility. However, I'd argue that the solution isn't to grant AI personhood, but rather to develop new legal frameworks specifically designed for AI accountability...",
      }]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/preview" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <span className="text-white font-bold text-xs">D</span>
              </div>
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <div>
              <h1 className="text-sm font-medium text-white truncate max-w-md">{mockDebate.topic}</h1>
              <p className="text-xs text-zinc-500">vs. {mockDebate.opponent}</p>
            </div>
          </div>
          
          <Link href="/preview" className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            End Debate
          </Link>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%]`}>
                  {/* Avatar & Name */}
                  <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs">⚖️</div>
                        <span className="text-xs font-medium text-zinc-400">{mockDebate.opponent}</span>
                      </>
                    )}
                    {msg.role === 'user' && (
                      <span className="text-xs font-medium text-zinc-400">You</span>
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-[#1a1a1f] border border-white/[0.06] text-zinc-100 rounded-bl-md'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs">⚖️</div>
                    <span className="text-xs font-medium text-zinc-400">{mockDebate.opponent}</span>
                  </div>
                  <div className="px-4 py-4 rounded-2xl rounded-bl-md bg-[#1a1a1f] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0b]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your argument..."
                className="w-full px-4 py-3 bg-[#131316] border border-white/[0.06] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 resize-none text-[15px] leading-relaxed pr-12"
                style={{ minHeight: '48px', maxHeight: '200px' }}
                rows={1}
              />
              
              {/* AI Takeover button */}
              <button className="absolute right-3 bottom-3 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors" title="Let AI argue for you">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!userInput.trim() || isTyping}
              className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                userInput.trim() && !isTyping
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-white/5 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Send
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          
          <p className="text-xs text-zinc-600 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  );
}
