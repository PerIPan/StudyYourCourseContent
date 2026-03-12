'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, SourceCitation } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, courseSlug: courseFilter }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let sources: SourceCitation[] = [];

        setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'citations') {
                sources = parsed.data;
              } else if (parsed.type === 'text') {
                assistantContent += parsed.data;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                    sources,
                  };
                  return updated;
                });
              }
            } catch { /* skip malformed SSE */ }
          }
        }
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [courseFilter]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages, courseFilter, setCourseFilter };
}
