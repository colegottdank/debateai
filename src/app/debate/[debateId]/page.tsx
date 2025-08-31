'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { opponents, getOpponentById } from '@/lib/opponents';

export default function DebatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  const debateId = params.debateId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this is an instant debate from homepage
  const isInstant = searchParams.get('instant') === 'true';
  const firstArg = searchParams.get('firstArg') || '';
  
  const [debate, setDebate] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Track if we've already sent the first message
  const [hasAutoSent, setHasAutoSent] = useState(false);

  // Load debate data
  useEffect(() => {
    const loadDebate = async () => {
      try {
        const response = await fetch(`/api/debate/${debateId}`);
        if (response.ok) {
          const data = await response.json();
          setDebate(data.debate);
          setMessages(data.debate.messages || []);
        }
      } catch (error) {
        console.error('Failed to load debate:', error);
      } finally {
        setIsLoadingDebate(false);
      }
    };
    
    loadDebate();
  }, [debateId]);

  // Handle auto-sending first argument (separate effect to prevent double-sends)
  useEffect(() => {
    if (isInstant && firstArg && debate && !hasAutoSent && messages.length === 1) {
      setHasAutoSent(true);
      setTimeout(() => {
        sendMessage(firstArg);
      }, 500);
    }
  }, [isInstant, firstArg, debate, messages.length, hasAutoSent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Check if this is the first user turn
    const isFirstTurn = messages.filter(m => m.role === 'user').length === 0;

    try {
      // Use Claude Code API for better debates
      const response = await fetch('/api/debate-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId,
          opponent: debate?.opponent || debate?.character,
          topic: debate?.topic,
          userArgument: textToSend,
          previousMessages: messages,
          isFirstTurn
        })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Add placeholder AI message
      const aiMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);
      setIsTyping(false);

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                accumulatedContent += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { role: 'ai', content: accumulatedContent };
                  return newMessages;
                });
              } else if (data.type === 'searching') {
                // Show that AI is searching for information
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { 
                    role: 'ai', 
                    content: `🔍 Searching: "${data.query}"\n\n${accumulatedContent}` 
                  };
                  return newMessages;
                });
              } else if (data.type === 'complete') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[aiMessageIndex] = { role: 'ai', content: data.content || accumulatedContent };
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Could not generate response. Try again!' }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  if (isLoadingDebate) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-100 mb-2">Loading debate...</div>
        </div>
      </div>
    );
  }

  const opponent = debate ? getOpponentById(debate.opponent || debate.character) : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-slate-100">
                DebateAI
              </Link>
              {debate && (
                <div className="text-sm text-slate-400">
                  <span className="font-medium">Topic:</span> {debate.topic}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/debate" className="text-slate-400 hover:text-slate-100">
                New Debate
              </Link>
              <Link href="/" className="text-slate-400 hover:text-slate-100">
                Exit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Opponent Info */}
          {opponent && messages.length === 0 && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                <span className="text-2xl">{opponent.avatar}</span>
                <div className="text-left">
                  <div className="font-semibold text-slate-100">{opponent.name}</div>
                  <div className="text-xs text-slate-400">{opponent.style}</div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{opponent?.avatar}</span>
                      <span className="text-sm font-medium text-slate-400">{opponent?.name}</span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="text-right mb-1">
                      <span className="text-sm font-medium text-slate-400">You</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'message-user' 
                      : 'message-ai'
                  }`}>
                    <p className="text-slate-100 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-900">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your argument..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-100 placeholder-slate-500"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !userInput.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isLoading || !userInput.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}