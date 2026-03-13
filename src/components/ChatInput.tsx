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
    <div
      className="border-t p-3"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border)' }}
    >
      {showVoiceSettings && (
        <div
          className="mb-2 px-2 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-muted)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Voice Settings
            </span>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="text-xs transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              close
            </button>
          </div>
          <select
            value={voice.selectedVoiceURI}
            onChange={e => voice.setSelectedVoiceURI(e.target.value)}
            className="w-full text-xs rounded px-2 py-1.5 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
            size={5}
          >
            {englishVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            ))}
          </select>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Speed</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {voice.rate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={voice.rate}
              onChange={e => voice.setRate(parseFloat(e.target.value))}
              className="w-full h-1.5"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="flex justify-between text-[0.6rem] mt-0.5" style={{ color: 'var(--border-strong)' }}>
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
          className="flex-1 border rounded-full px-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />

        {/* Mute / unmute TTS */}
        <button
          type="button"
          onClick={toggleMute}
          title={voice.autoReadAloud ? 'Mute voice' : 'Unmute voice'}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: voice.autoReadAloud ? 'var(--text-secondary)' : 'var(--text-muted)',
            backgroundColor: voice.autoReadAloud ? 'transparent' : 'var(--bg-muted)',
          }}
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
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            backgroundColor: showVoiceSettings ? 'var(--bg-muted)' : 'transparent',
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="theme-accent-btn w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          onMouseEnter={e => ((e.currentTarget).style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={e => ((e.currentTarget).style.backgroundColor = 'var(--accent)')}
        >
          ↑
        </button>
      </form>

      <p className="text-center text-[0.65rem] mt-1.5" style={{ color: 'var(--text-muted)' }}>
        Hold mic or Ctrl to speak (Firefox not supported){' '}
        {voice.autoReadAloud ? '· summary read aloud' : '· voice muted'}
      </p>
    </div>
  );
}
