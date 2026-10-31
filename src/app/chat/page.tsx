'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/nova-auth';
import { useChatStore } from '@/stores/nova-chat';
import { Sidebar } from '@/components/nova/Sidebar';
import { ChatComposer } from '@/components/nova/ChatComposer';
import { MessageItem } from '@/components/nova/MessageItem';
import { SettingsModal } from '@/components/nova/SettingsModal';
import { 
  Lock, Mail, Menu, ArrowRight, Sparkles,
  HelpCircle, Code, FileText, Compass, AlertCircle
} from 'lucide-react';
import { NovaLogo } from '@/components/nova/NovaLogo';
import Link from 'next/link';

export default function ChatPage() {
  const { isInitialized, isAuthenticated, initialize, login, register, error: authError, clearError } = useAuthStore();
  const { 
    messages, selectConversation, fetchConversations, fetchSettings, 
    fetchModels, currentConversationId, conversations, sendMessage, isGenerating
  } = useChatStore();

  // Auth screen forms state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Layout modals/menus
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);
  const isAutoScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const animationFrameRef = useRef<number>();
  const streamingScrollTimeout = useRef<NodeJS.Timeout>();

  // Initialize Auth & global configurations on load
  useEffect(() => {
    initialize();
  }, []);

  // Fetch initial chat states on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchSettings();
      fetchModels();
    }
  }, [isAuthenticated]);

  // Handle scroll events for user interaction detection
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const threshold = 100; // Distance from bottom to consider "near bottom"
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= threshold;
      
      // Store scroll position for comparison
      lastScrollTop.current = scrollTop;
      
      // Update user near bottom state
      isUserNearBottom.current = isNearBottom;
      
      // Clear any pending streaming scroll if user manually scrolls
      if (streamingScrollTimeout.current) {
        clearTimeout(streamingScrollTimeout.current);
        streamingScrollTimeout.current = undefined;
      }
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced streaming scroll behavior
  useEffect(() => {
    if (!isGenerating || !isUserNearBottom.current) return;
    
    // Set up continuous scrolling during streaming
    const performStreamingScroll = () => {
      if (isGenerating && isUserNearBottom.current && chatContainerRef.current) {
        // Instant scroll for streaming
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        // Schedule next scroll
        streamingScrollTimeout.current = setTimeout(performStreamingScroll, 50);
      }
    };
    
    // Start streaming scroll
    streamingScrollTimeout.current = setTimeout(performStreamingScroll, 50);
    
    return () => {
      if (streamingScrollTimeout.current) {
        clearTimeout(streamingScrollTimeout.current);
      }
    };
  }, [isGenerating]);

  // Enhanced scroll function with performance optimization
  const scrollToBottom = (useSmooth = true) => {
    if (messagesEndRef.current && chatContainerRef.current) {
      isAutoScrolling.current = true;
      
      if (useSmooth) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      } else {
        // Instant scroll for performance during streaming
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      
      // Reset auto-scroll flag after animation
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, useSmooth ? 1000 : 50);
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (!isUserNearBottom.current) return; // Don't scroll if user scrolled away
    
    // Use requestAnimationFrame for better performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      // Check if we have new messages (not just existing ones updating)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'user') {
        // User message - always scroll smoothly
        scrollToBottom(true);
      } else if (lastMessage && lastMessage.sender === 'assistant' && isGenerating) {
        // AI streaming - use instant scroll for better performance during streaming
        // Only scroll if we're actively streaming and user hasn't scrolled away
        if (isUserNearBottom.current || isAutoScrolling.current) {
          scrollToBottom(false);
        }
      }
    });
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [messages, isGenerating]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    clearError();

    if (authTab === 'login') {
      const success = await login(email, password);
      if (success) {
        setEmail('');
        setPassword('');
      }
    } else {
      const success = await register(email, password);
      if (success) {
        alert('Registration successful! Please sign in.');
        setAuthTab('login');
        setPassword('');
      }
    }
    setAuthLoading(false);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  // Scroll to bottom button component
  const ScrollToBottomButton = () => {
    if (!isUserNearBottom.current && messages.length > 0) {
      return (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={() => scrollToBottom(true)}
            className="px-3 py-2 bg-nova-accent hover:bg-nova-accent-hover text-white rounded-lg shadow-lg transition-all duration-200 active:scale-95"
          >
            ↓ Latest
          </button>
        </div>
      );
    }
    return null;
  };

  // 1. Loading screen
  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-chatbg-light dark:bg-chatbg-dark text-gray-900 dark:text-white">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-nova-accent text-white shadow-xl shadow-indigo-500/20 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="mt-4 font-bold text-sm tracking-wide animate-pulse">Initializing NOVA AI...</h2>
      </div>
    );
  }

  // 2. Auth view - Require proper authentication
  if (!isAuthenticated) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-chatbg-light dark:bg-chatbg-dark px-3 sm:px-4 overflow-hidden">
        {/* Soft glowing ambient spots */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-nova-accent/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-md sm:max-w-lg p-4 sm:p-6 bg-white dark:bg-sidebarbg-dark/45 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-nova-accent shadow-xl shadow-indigo-500/20 mb-2 sm:mb-3">
              <NovaLogo />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">NOVA AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">ChatGPT-style production chat workspace</p>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-4 sm:mb-6">
            <button
              onClick={() => { setAuthTab('login'); clearError(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${authTab === 'login' ? 'bg-white dark:bg-panelbg-dark text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthTab('register'); clearError(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${authTab === 'register' ? 'bg-white dark:bg-panelbg-dark text-gray-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-nova-accent/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-nova-accent/40"
                />
              </div>
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 text-xs border border-red-200 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#C9A96E] hover:bg-[#B8860B] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#C9A96E]/30 transition active:scale-98 border border-[#C9A96E]/20"
            >
              {authLoading ? 'Processing...' : authTab === 'login' ? 'Sign In' : 'Sign Up'}
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Quick start option */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Quick start:</p>
            <button
              onClick={() => {
                setEmail('user@novaai.com');
                setPassword('user123');
                setAuthTab('login');
              }}
              className="text-xs text-nova-accent hover:text-nova-accent-hover transition font-medium"
            >
              Use demo credentials
            </button>
            <div className="mt-3 text-center">
              <Link href="/" className="text-xs text-gray-500 hover:text-nova-accent transition">
                ← Back to NOVA AI Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated dashboard view
  const currentChatTitle = conversations.find(c => c.id === currentConversationId)?.title || 'New Chat';

  return (
    <div className="flex h-screen bg-chatbg-light dark:bg-chatbg-dark overflow-hidden font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main chat window */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
        
        {/* Header bar */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 min-h-[60px] flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 sm:p-2.5 md:hidden text-[#6B7280] hover:text-[#374151] dark:hover:text-[#E5E7EB] hover:bg-gray-100 dark:hover:bg-gray-200 rounded-xl transition border border-transparent hover:border-gray-300/30"
            >
              <Menu className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[100px] sm:max-w-[150px] md:max-w-md">
                {currentChatTitle || "New Chat"}
              </span>
              <span className="text-xxs text-gray-500 dark:text-gray-400">
                NOVA AI workspace
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition"
            >
              Home
            </Link>
            <button
              onClick={() => selectConversation(null)}
              className="text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Scrollable message area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollBehavior: 'smooth', touchAction: 'pan-y' }}>
          <div className="pb-20 sm:pb-24 md:pb-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center max-w-2xl mx-auto">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-nova-accent/15 text-nova-accent border border-nova-accent/20 mb-8 shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Welcome to NOVA AI</h2>
                <p className="text-sm sm:text-xs text-gray-600 dark:text-gray-400 mb-10 max-w-sm mx-auto">
                  How can I assist you today? Start asking questions, write programming scripts, or upload documents to query their content.
                </p>

                {/* Suggestions grid */}
                <div className="grid grid-cols-1 gap-4 w-full max-w-sm mx-auto">
                  <button
                    onClick={() => handleSuggestedPrompt("Explain quantum computing in extremely simple terms")}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-nova-accent/40 bg-white/60 dark:bg-gray-800/15 hover:bg-nova-accent/5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition active:scale-[0.98]"
                  >
                    <Compass className="w-5 h-5 text-nova-accent" />
                    <span className="text-sm">Explain quantum computing in simple terms</span>
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt("Write a clean python script to parse a nested JSON block")}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-nova-accent/40 bg-white/60 dark:bg-gray-800/15 hover:bg-nova-accent/5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition active:scale-[0.98]"
                  >
                    <Code className="w-5 h-5 text-nova-accent" />
                    <span className="text-sm">Write a python script to parse JSON</span>
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt("Summarize key strategies for scaling a fastAPI backend")}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-nova-accent/40 bg-white/60 dark:bg-gray-800/15 hover:bg-nova-accent/5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition active:scale-[0.98]"
                  >
                    <FileText className="w-5 h-5 text-nova-accent" />
                    <span className="text-sm">Summarize methods to scale FastAPI</span>
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt("What are the best practices to avoid useEffect memory leaks?")}
                    className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-nova-accent/40 bg-white/60 dark:bg-gray-800/15 hover:bg-nova-accent/5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition active:scale-[0.98]"
                  >
                    <HelpCircle className="w-5 h-5 text-nova-accent" />
                    <span className="text-sm">React useEffect hooks best practices</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Fixed composer area */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <ChatComposer />
        </div>

        {/* Scroll to bottom button */}
        <ScrollToBottomButton />

      </div>

      {/* Settings Dialog Overlay */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

    </div>
  );
}
