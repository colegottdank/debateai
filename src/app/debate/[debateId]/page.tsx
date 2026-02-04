"use client";

import { useState, useEffect, useRef, memo } from "react";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useSearchParams } from "next/navigation";
import { getOpponentById } from "@/lib/opponents";
import Header from "@/components/Header";
import UpgradeModal from "@/components/UpgradeModal";

// Streaming indicator
const StreamingIndicator = memo(() => (
  <div className="flex items-center gap-1.5 h-5">
    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '100ms' }} />
    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '200ms' }} />
  </div>
));
StreamingIndicator.displayName = "StreamingIndicator";

// Search indicator
const SearchIndicator = memo(({ message }: { message: string }) => (
  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
    <span>{message}</span>
  </div>
));
SearchIndicator.displayName = "SearchIndicator";

// Helper to render content with clickable citation links
const renderContentWithCitations = (
  content: string,
  citations: Array<{ id: number; url: string; title: string }> | undefined,
  onCitationClick: (id: number) => void
) => {
  if (!citations || citations.length === 0) {
    return content;
  }

  // Match citation markers like [1], [2], [3]
  const parts = content.split(/(\[\d+\])/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const citationId = parseInt(match[1], 10);
      const citation = citations.find(c => c.id === citationId);
      if (citation) {
        return (
          <button
            key={index}
            onClick={() => onCitationClick(citationId)}
            className="inline-flex items-baseline text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]
              hover:underline transition-colors cursor-pointer align-super leading-none mx-0.5"
            title={citation.title || citation.url}
          >
            [{citationId}]
          </button>
        );
      }
    }
    return part;
  });
};

// Message component
const Message = memo(
  ({
    msg,
    opponent,
    debate,
    isAILoading,
    isUserLoading,
  }: {
    msg: {
      role: string;
      content: string;
      aiAssisted?: boolean;
      citations?: Array<{ id: number; url: string; title: string }>;
      isSearching?: boolean;
    };
    opponent: any;
    debate: any;
    isAILoading: boolean;
    isUserLoading?: boolean;
  }) => {
    const isUser = msg.role === "user";
    const isStreaming = (isUser && isUserLoading) || (!isUser && isAILoading);
    const hasContent = msg.content && msg.content.length > 0;
    const [showCitations, setShowCitations] = useState(false);
    const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null);
    const citationRefs = useRef<{ [key: number]: HTMLAnchorElement | null }>({});

    const handleCitationClick = (citationId: number) => {
      // Open citations panel if not already open
      if (!showCitations) {
        setShowCitations(true);
      }

      // Highlight the citation
      setHighlightedCitation(citationId);

      // Scroll to the citation after a brief delay for panel to open
      setTimeout(() => {
        const citationEl = citationRefs.current[citationId];
        if (citationEl) {
          citationEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);

      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedCitation(null);
      }, 2000);
    };

    return (
      <div className={`py-5 ${isUser ? '' : 'bg-[var(--bg-elevated)]/60 border-y border-[var(--border)]/30'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm
              ${isUser
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'bg-[var(--bg-sunken)] border border-[var(--border)]/50'
              }`}
            >
              {isUser ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              ) : (
                opponent?.avatar || "🤖"
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              {/* Name */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-[var(--text)]">
                  {isUser ? "You" : (opponent?.name || debate?.opponentStyle || "AI Opponent")}
                </span>
                {msg.aiAssisted && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                    AI-assisted
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="text-[15px] leading-7 text-[var(--text)]">
                {!hasContent && isStreaming ? (
                  msg.isSearching ? (
                    <SearchIndicator message={msg.content || "Searching..."} />
                  ) : (
                    <StreamingIndicator />
                  )
                ) : (
                  <div className="whitespace-pre-wrap">
                    {renderContentWithCitations(msg.content, msg.citations, handleCitationClick)}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--accent)] animate-pulse rounded-sm" />
                    )}
                  </div>
                )}
              </div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowCitations(!showCitations)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <span>Sources ({msg.citations.length})</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showCitations ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${showCitations ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((citation) => (
                        <a
                          key={citation.id}
                          ref={(el) => { citationRefs.current[citation.id] = el; }}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-sunken)]
                            text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]
                            hover:bg-[var(--accent)]/5 transition-all duration-300 border border-[var(--border)]/30
                            ${highlightedCitation === citation.id
                              ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10 scale-105'
                              : ''}`}
                        >
                          <span className="font-medium text-[var(--accent)]">[{citation.id}]</span>
                          <span className="truncate max-w-[160px]">
                            {citation.title || new URL(citation.url).hostname}
                          </span>
                          <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";

// Search messages
const SEARCH_MESSAGES = [
  "🔍 Searching for evidence...",
  "📚 Analyzing sources...",
  "🧠 Formulating argument...",
  "💡 Building counterpoints...",
];

export default function DebatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  const debateId = params.debateId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [debate, setDebate] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState("");
  const instantDebateActiveRef = useRef(false);
  const [isLoadingDebate, setIsLoadingDebate] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isAITakeover, setIsAITakeover] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [rateLimitData, setRateLimitData] = useState<{ current: number; limit: number } | undefined>();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dev mode check from URL
  const isDevMode = searchParams.get('dev') === 'true';

  // Load debate
  useEffect(() => {
    const loadDebate = async () => {
      if (isDevMode) {
        setDebate({
          id: debateId,
          topic: "Should AI be regulated?",
          opponentStyle: "Elon Musk",
          character: "elon",
          messages: [
            { role: "user", content: "I think AI should be regulated to ensure safety and prevent misuse. We need guardrails in place before it's too late." },
            { role: "ai", content: "I disagree. Regulation stifles innovation. We need to move fast and break things. The market will self-regulate. Look at how the tech industry has evolved - innovation happens when smart people are free to experiment, not when bureaucrats write rules about technology they don't understand." }
          ]
        });
        setMessages([
          { role: "user", content: "I think AI should be regulated to ensure safety and prevent misuse. We need guardrails in place before it's too late." },
          { role: "ai", content: "I disagree. Regulation stifles innovation. We need to move fast and break things. The market will self-regulate. Look at how the tech industry has evolved - innovation happens when smart people are free to experiment, not when bureaucrats write rules about technology they don't understand." }
        ]);
        setIsLoadingDebate(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/debate/${debateId}`);
        if (response.ok) {
          const data = await response.json();
          setDebate(data.debate);
          // Only set messages if instant debate isn't already in progress
          // (prevents React StrictMode's second effect run from overwriting)
          if (!instantDebateActiveRef.current) {
            setMessages(data.debate.messages || []);
          }
        }
      } catch (error) {
        console.error("Failed to load debate:", error);
      } finally {
        setIsLoadingDebate(false);
      }
    };

    loadDebate();
  }, [debateId, isDevMode]);

  // Handle instant debate from landing page
  useEffect(() => {
    const isInstant = sessionStorage.getItem('isInstantDebate') === 'true';
    const firstArgument = sessionStorage.getItem('firstArgument');
    
    if (isInstant && firstArgument && debate && !isLoadingDebate) {
      // Mark instant debate as active - prevents loadDebate from overwriting messages
      instantDebateActiveRef.current = true;

      // Clear session storage
      sessionStorage.removeItem('isInstantDebate');
      sessionStorage.removeItem('firstArgument');

      // Auto-send the first message
      const sendFirstMessage = async () => {
        const userMessage = {
          role: "user",
          content: firstArgument,
          aiAssisted: false
        };

        // Add user message
        setMessages(prev => [...prev, userMessage]);
        setIsUserLoading(true);

        if (isDevMode) {
          // Simulate in dev mode
          setTimeout(() => {
            setIsUserLoading(false);
            setIsAILoading(true);
            
            setTimeout(() => {
              const aiMessage = {
                role: "ai",
                content: "That's an interesting point. However, I believe the free market will naturally find the right balance without government intervention. History has shown that excessive regulation often creates more problems than it solves."
              };
              setMessages(prev => [...prev, aiMessage]);
              setIsAILoading(false);
            }, 1500);
          }, 500);
        } else {
          // Real API call with streaming
          try {
            setIsUserLoading(false);
            setIsAILoading(true);

            // Add placeholder AI message for streaming
            setMessages(prev => [...prev, { role: 'ai', content: '' }]);

            const response = await fetch('/api/debate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                debateId,
                character: debate.opponent || debate.character || 'custom',
                opponentStyle: debate.opponentStyle,
                topic: debate.topic,
                userArgument: firstArgument,
                previousMessages: [],
                isAIAssisted: false
              })
            });

            if (!response.ok) {
              const error = await response.json();
              if (response.status === 429 && error.upgrade_required) {
                setRateLimitData({ current: error.current, limit: error.limit });
                setShowUpgradeModal(true);
                // Remove the placeholder AI message
                setMessages(prev => prev.slice(0, -1));
              }
              throw new Error(error.error || 'Failed to send message');
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let citations: Array<{ id: number; url: string; title: string }> = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(line.substring(6));
                    if (data.type === 'chunk') {
                      accumulatedContent += data.content;
                      setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                          role: 'ai',
                          content: accumulatedContent,
                          citations: citations.length > 0 ? citations : undefined
                        };
                        return newMessages;
                      });
                    } else if (data.type === 'citations' && data.citations) {
                      citations = data.citations;
                    } else if (data.type === 'search_start') {
                      setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                          role: 'ai',
                          content: '',
                          isSearching: true
                        };
                        return newMessages;
                      });
                    } else if (data.type === 'complete') {
                      setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                          role: 'ai',
                          content: data.content,
                          citations: data.citations || (citations.length > 0 ? citations : undefined)
                        };
                        return newMessages;
                      });
                    }
                  } catch { /* skip invalid JSON */ }
                }
              }
            }
          } catch (error) {
            console.error("Failed to send first message:", error);
            // Remove placeholder if there was an error
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === 'ai' && !lastMsg.content) {
                return prev.slice(0, -1);
              }
              return prev;
            });
          } finally {
            setIsAILoading(false);
          }
        }
      };
      
      sendFirstMessage();
    }
  }, [debate, isLoadingDebate, debateId, isDevMode]);

  // Auto-scroll - use instant scroll during streaming to prevent bouncing
  useEffect(() => {
    if (isAutoScrollEnabled && messagesEndRef.current) {
      // Use 'instant' scroll during AI streaming to prevent layout bouncing
      const behavior = isAILoading ? 'instant' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [messages, isAutoScrollEnabled, isAILoading]);

  const opponent = debate ? getOpponentById(debate.opponent || debate.character) : null;

  // Handle scroll - throttled to reduce state updates
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleScroll = () => {
    if (scrollTimeoutRef.current) return;
    
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAutoScrollEnabled(isNearBottom);
      }
    }, 100);
  };

  // Send message handler
  const handleSend = async () => {
    if (!userInput.trim() || isUserLoading || isAILoading) return;
    
    const messageText = userInput.trim();
    
    // Add user message immediately
    const userMessage = { 
      role: "user", 
      content: messageText,
      aiAssisted: isAITakeover 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsUserLoading(true);
    setIsAutoScrollEnabled(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    if (isDevMode) {
      // Simulate API delay
      setTimeout(() => {
        setIsUserLoading(false);
        setIsAILoading(true);
        
        // Simulate AI response after a delay
        setTimeout(() => {
          const aiMessage = {
            role: "ai",
            content: "That's an interesting point. However, I believe the free market will naturally find the right balance without government intervention. History has shown that excessive regulation often creates more problems than it solves."
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsAILoading(false);
        }, 1500);
      }, 500);
    } else {
      // Real API call with streaming
      try {
        setIsUserLoading(false);
        setIsAILoading(true);

        // Add placeholder AI message for streaming
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);

        const response = await fetch('/api/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            debateId,
            character: debate?.opponent || debate?.character || 'custom',
            opponentStyle: debate?.opponentStyle,
            topic: debate?.topic,
            userArgument: messageText,
            previousMessages: messages,
            isAIAssisted: isAITakeover
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (response.status === 429 && error.upgrade_required) {
            setRateLimitData({ current: error.current, limit: error.limit });
            setShowUpgradeModal(true);
            // Remove the user message we just added and the placeholder AI message
            setMessages(prev => prev.slice(0, -2));
            setUserInput(messageText); // Restore input
          }
          throw new Error(error.error || 'Failed to send message');
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let citations: Array<{ id: number; url: string; title: string }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'chunk') {
                  accumulatedContent += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'ai',
                      content: accumulatedContent,
                      citations: citations.length > 0 ? citations : undefined
                    };
                    return newMessages;
                  });
                } else if (data.type === 'citations' && data.citations) {
                  citations = data.citations;
                } else if (data.type === 'search_start') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'ai',
                      content: '',
                      isSearching: true
                    };
                    return newMessages;
                  });
                } else if (data.type === 'complete') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'ai',
                      content: data.content,
                      citations: data.citations || (citations.length > 0 ? citations : undefined)
                    };
                    return newMessages;
                  });
                }
              } catch { /* skip invalid JSON */ }
            }
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        // Remove placeholder if there was an error and it's empty
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'ai' && !lastMsg.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsAILoading(false);
      }
    }
  };

  // Loading state
  if (!isDevMode && (isSignedIn === undefined || isLoadingDebate)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-[var(--text-secondary)]">Loading debate...</p>
          </div>
        </div>
      </div>
    );
  }

  const canSend = userInput.trim().length > 0 && !isUserLoading && !isAILoading;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      {/* Topic Header - Fixed */}
      {debate && (
        <div className="flex-shrink-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/80">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">Topic</span>
              <h1 className="font-medium text-[var(--text)] truncate max-w-[200px] sm:max-w-[300px]">{debate.topic}</h1>
              {(debate.opponentStyle || opponent) && (
                <>
                  <span className="text-[var(--border-strong)]">·</span>
                  <span className="text-[var(--text-secondary)]">vs {debate.opponentStyle || opponent?.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages - Scrollable */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0"
        onScroll={handleScroll}
      >
        <div className="pb-4">
          {messages.filter((msg) => msg && msg.role).map((msg, idx) => (
            <Message
              key={idx}
              msg={msg}
              opponent={opponent}
              debate={debate}
              isAILoading={isAILoading && idx === messages.length - 1}
              isUserLoading={isUserLoading && idx === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          {/* Input Row */}
          <div className="flex gap-2">
            {/* Textarea Container */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) handleSend();
                  }
                }}
                placeholder="Make your argument..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl 
                  px-4 py-3 resize-none text-[var(--text)] placeholder-[var(--text-tertiary)] 
                  outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20
                  transition-all min-h-[48px] max-h-[200px] text-[15px] leading-relaxed overflow-hidden"
                rows={1}
                disabled={isUserLoading || isAILoading}
              />
            </div>
            
            {/* Buttons - Fixed size, centered vertically */}
            <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
              {/* AI Takeover Button */}
              <button
                type="button"
                onClick={() => setIsAITakeover(!isAITakeover)}
                disabled={isUserLoading || isAILoading}
                className={`
                  w-10 h-10 rounded-lg border flex items-center justify-center
                  transition-all duration-200 flex-shrink-0
                  ${isAITakeover 
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' 
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30'
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
                title="Let AI argue for you"
                aria-pressed={isAITakeover}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </button>
              
              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  transition-all duration-200
                  ${canSend 
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] cursor-pointer' 
                    : 'bg-[var(--bg-sunken)] text-[var(--text-tertiary)] cursor-not-allowed'
                  }
                `}
                title="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Keyboard Hints */}
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-[10px]">Enter</kbd>
              to send
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sunken)] border border-[var(--border)] text-[var(--text-secondary)] font-mono text-[10px]">Shift + Enter</kbd>
              for new line
            </span>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="rate-limit-message"
        limitData={rateLimitData}
      />
    </div>
  );
}
