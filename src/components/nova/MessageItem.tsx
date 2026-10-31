import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/types/nova';
import { Copy, Check, Bot, User, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

// Custom components for ReactMarkdown
const components = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (!inline && language) {
      return (
        <div className="relative my-4">
          <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
              className="px-2 py-1 text-xs bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={document.documentElement.classList.contains('dark') ? oneDark : oneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: '0.75rem 0',
              borderRadius: '0.5rem',
              fontSize: '0.75em sm:0.875em',
              lineHeight: '1.5',
              background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
              color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflowX: 'auto',
              overflowY: 'visible',
              wordBreak: 'normal',
              overflowWrap: 'normal',
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    return (
      <code className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 text-sm font-mono break-all" {...props}>
        {children}
      </code>
    );
  },
  pre({ children }: any) {
    return <div className="my-4 overflow-x-auto overflow-y-visible">{children}</div>;
  },
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { sender, content, citations } = message;
  const isAssistant = sender === 'assistant';
  
  const [copied, setCopied] = useState(false);
  const [activeCitationIndex, setActiveCitationIndex] = useState<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const toggleCitation = (idx: number) => {
    if (activeCitationIndex === idx) {
      setActiveCitationIndex(null);
    } else {
      setActiveCitationIndex(idx);
    }
  };

  return (
    <div className={`flex w-full py-6 px-4 md:px-6 gap-4 border-b border-gray-150/40 dark:border-gray-800/30 min-w-0 ${
      isAssistant ? 'bg-gray-50/30 dark:bg-sidebarbg-dark/10' : 'bg-transparent'
    }`}>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
        isAssistant 
          ? 'bg-nova-accent/15 text-nova-accent border border-nova-accent/25' 
          : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300/20'
      }`}>
        {isAssistant ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
      </div>

      {/* Message Body Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 break-words overflow-visible">
        {/* Author header */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {isAssistant ? 'NOVA AI' : 'You'}
          </span>
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition border border-transparent hover:border-gray-300/30"
              title="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280] dark:text-[#D1D5DB]" />}
            </button>
          </div>
        </div>

        {/* Text Markdown Render */}
        <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-800 dark:text-gray-100 break-word overflow-wrap-anywhere ${
          isAssistant && (content === 'Thinking...' || content === '') ? 'streaming-cursor italic text-gray-500' : ''
        }`}>
          <ReactMarkdown components={components}>
            {content || (isAssistant ? 'Thinking...' : '')}
          </ReactMarkdown>
        </div>

        {/* Citations references */}
        {isAssistant && citations && citations.length > 0 && (
          <div className="mt-4 border-t border-gray-300/50 dark:border-gray-700/50 pt-3 flex flex-col gap-2">
            <span className="text-xxs font-bold uppercase tracking-wider text-[#9CA3AF] dark:text-[#9CA3AF] flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#9CA3AF]" /> Sources used in response
            </span>
            <div className="flex flex-col gap-1.5">
              {citations.map((cite, idx) => {
                const isOpen = activeCitationIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 overflow-hidden transition"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCitation(idx)}
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-[#374151] dark:text-[#E5E7EB] hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition border border-transparent hover:border-gray-300/30"
                    >
                      <span className="truncate">{cite.filename}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#374151] dark:text-[#E5E7EB]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#374151] dark:text-[#E5E7EB]" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-xxs leading-relaxed font-mono text-[#6B7280] dark:text-[#D1D5DB] whitespace-pre-wrap border-t border-gray-200/50 dark:border-gray-700/50">
                        {cite.snippet}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
