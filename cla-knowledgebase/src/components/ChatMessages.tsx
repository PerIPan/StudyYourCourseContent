'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import { SourceCitationBlock } from './SourceCitation';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className="max-w-[85%] rounded-xl px-5 py-4"
            style={
              msg.role === 'user'
                ? {
                    backgroundColor: 'var(--user-bubble)',
                    color: 'var(--user-bubble-text)',
                    borderBottomRightRadius: '4px',
                  }
                : {
                    backgroundColor: 'var(--assistant-bubble)',
                    color: 'var(--assistant-bubble-text)',
                    border: '1px solid var(--border)',
                    borderBottomLeftRadius: '4px',
                    boxShadow: 'var(--shadow-card)',
                  }
            }
          >
            {msg.role === 'assistant' ? (
              <div
                className="prose prose-sm max-w-none
                  prose-p:my-2 prose-p:leading-relaxed prose-p:text-[0.95rem]
                  prose-headings:mt-4 prose-headings:mb-2
                  prose-h3:text-base prose-h4:text-sm
                  prose-strong:font-semibold
                  prose-ul:my-2 prose-ul:space-y-1 prose-ol:my-2 prose-ol:space-y-1
                  prose-li:text-[0.95rem] prose-li:leading-relaxed
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-a:no-underline hover:prose-a:underline
                "
                style={{
                  /* Override prose defaults with theme vars */
                  ['--tw-prose-body' as string]: 'var(--prose-body)',
                  ['--tw-prose-headings' as string]: 'var(--prose-headings)',
                  ['--tw-prose-bold' as string]: 'var(--prose-strong)',
                  ['--tw-prose-links' as string]: 'var(--prose-link)',
                  ['--tw-prose-code' as string]: 'var(--prose-code-text)',
                  ['--tw-prose-bullets' as string]: 'var(--text-muted)',
                  ['--tw-prose-counters' as string]: 'var(--text-muted)',
                }}
              >
                <style>{`
                  .prose code { background: var(--prose-code-bg); color: var(--prose-code-text); }
                  .prose a { color: var(--prose-link); }
                  .prose strong { color: var(--prose-strong); }
                  .prose h1, .prose h2, .prose h3, .prose h4 { color: var(--prose-headings); }
                  .prose p, .prose li { color: var(--prose-body); }
                `}</style>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">
                {msg.content}
              </div>
            )}
            {msg.role === 'assistant' && msg.sources && (
              <SourceCitationBlock sources={msg.sources} />
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div
            className="rounded-xl rounded-bl-sm px-4 py-3 flex gap-1 border"
            style={{
              backgroundColor: 'var(--assistant-bubble)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="loading-dot w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: 'var(--loading-dot)',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
