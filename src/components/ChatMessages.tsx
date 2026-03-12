'use client';

import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';
import { SourceCitationBlock } from './SourceCitation';

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Ask a question about your CLA course materials
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
            msg.role === 'user'
              ? 'bg-indigo-500 text-white rounded-br-none'
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
          }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.role === 'assistant' && msg.sources && (
              <SourceCitationBlock sources={msg.sources} />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
