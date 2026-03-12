'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import { SourceCitationBlock } from './SourceCitation';

const SUGGESTIONS = [
  'Explain zero trust architecture',
  'What are the key cyber threat categories?',
  'Summarize risk management frameworks',
];

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onSend: (msg: string) => void;
}

export function ChatMessages({ messages, isLoading, onSend }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-xs text-indigo-600 max-w-sm w-full text-center">
          <svg
            className="w-10 h-10 mx-auto mb-2 text-indigo-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="font-semibold text-sm text-indigo-700 mb-1">What do you want to study today?</p>
          <p>💡 Hold the mic button or press Ctrl to speak · unmute 🔊 to hear summaries read aloud</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center max-w-sm w-full">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-5 py-4 ${
            msg.role === 'user'
              ? 'bg-indigo-500 text-white rounded-br-none text-[0.95rem] leading-relaxed'
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
          }`}>
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm prose-slate max-w-none
                prose-p:my-2 prose-p:leading-relaxed prose-p:text-[0.95rem]
                prose-headings:text-slate-800 prose-headings:mt-4 prose-headings:mb-2
                prose-h3:text-base prose-h4:text-sm
                prose-strong:text-slate-800 prose-strong:font-semibold
                prose-ul:my-2 prose-ul:space-y-1 prose-ol:my-2 prose-ol:space-y-1
                prose-li:text-[0.95rem] prose-li:leading-relaxed
                prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-indigo-600
                prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline
              ">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
            {msg.role === 'assistant' && msg.sources && (
              <SourceCitationBlock sources={msg.sources} />
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none shadow-sm px-4 py-3 flex gap-1">
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
