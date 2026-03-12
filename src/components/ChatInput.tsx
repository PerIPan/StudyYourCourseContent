'use client';

import { useState } from 'react';
import { VoiceButton } from './VoiceButton';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  voice: {
    isListening: boolean;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => string;
  };
}

export function ChatInput({ onSend, isLoading, voice }: ChatInputProps) {
  const [input, setInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  }

  function handleVoiceUp() {
    const text = voice.stopListening();
    if (text.trim()) {
      onSend(text.trim());
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <VoiceButton
          isListening={voice.isListening}
          isSupported={voice.isSupported}
          onMouseDown={voice.startListening}
          onMouseUp={handleVoiceUp}
        />
        <input
          value={voice.isListening ? 'Listening...' : input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your CLA course material..."
          disabled={isLoading || voice.isListening}
          className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          ↑
        </button>
      </form>
      <p className="text-center text-slate-400 text-[0.65rem] mt-1.5">
        Hold mic to speak - answers read aloud automatically
      </p>
    </div>
  );
}
