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
    autoReadAloud: boolean;
    setAutoReadAloud: (v: boolean) => void;
    stopSpeaking: () => void;
    voices: SpeechSynthesisVoice[];
    selectedVoiceURI: string;
    setSelectedVoiceURI: (uri: string) => void;
    rate: number;
    setRate: (r: number) => void;
  };
}

export function ChatInput({ onSend, isLoading, voice }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

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

  function toggleMute() {
    if (voice.autoReadAloud) voice.stopSpeaking();
    voice.setAutoReadAloud(!voice.autoReadAloud);
  }

  const englishVoices = voice.voices.filter(v => v.lang.startsWith('en'));

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      {showVoiceSettings && (
        <div className="mb-2 px-2 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Voice Settings</span>
            <button onClick={() => setShowVoiceSettings(false)} className="text-xs text-slate-400 hover:text-slate-600">close</button>
          </div>
          <select
            value={voice.selectedVoiceURI}
            onChange={e => voice.setSelectedVoiceURI(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-700"
            size={5}
          >
            {englishVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            ))}
          </select>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Speed</span>
              <span className="text-xs text-slate-400">{voice.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voice.rate}
              onChange={e => voice.setRate(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-indigo-500"
            />
            <div className="flex justify-between text-[0.6rem] text-slate-300 mt-0.5">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      )}
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
        {/* Mute / unmute TTS */}
        <button
          type="button"
          onClick={toggleMute}
          title={voice.autoReadAloud ? 'Mute voice' : 'Unmute voice'}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
            voice.autoReadAloud
              ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
              : 'bg-slate-100 text-slate-300 border-slate-200'
          }`}
        >
          {voice.autoReadAloud ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
        {/* Voice settings */}
        <button
          type="button"
          onClick={() => setShowVoiceSettings(!showVoiceSettings)}
          title="Voice settings"
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          ↑
        </button>
      </form>
      <p className="text-center text-slate-400 text-[0.65rem] mt-1.5">
        Hold mic or Ctrl to speak (Firefox not supported) {voice.autoReadAloud ? '· summary read aloud' : '· voice muted'}
      </p>
    </div>
  );
}
