'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { NavTabs } from '@/components/NavTabs';
import { CourseBadges } from '@/components/CourseBadges';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';

export default function ChatPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const { messages, isLoading, sendMessage, courseFilter, setCourseFilter, answerLength, setAnswerLength } = useChat();
  const voice = useVoice();

  useEffect(() => {
    if (!loading && !role) router.push('/');
  }, [loading, role, router]);

  // Cancel TTS when user sends a new message
  const wrappedSendMessage = useCallback((text: string) => {
    voice.stopSpeaking();
    sendMessage(text);
  }, [sendMessage, voice.stopSpeaking]);

  // TTS: read [VOICE] summary when assistant response finishes
  const prevMessagesLen = useRef(0);
  useEffect(() => {
    if (!isLoading && messages.length > prevMessagesLen.current) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content) {
        const voiceMatch = last.content.match(/\[VOICE:\s*([\s\S]+?)\]/);
        if (voiceMatch) {
          voice.speak(voiceMatch[1].trim());
        }
      }
      prevMessagesLen.current = messages.length;
    }
  }, [isLoading, messages.length, voice.speak]);

  // Ctrl hold-to-talk
  useEffect(() => {
    if (!voice.isSupported) return;
    const ctrlHeld = { current: false };
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Control' && !ctrlHeld.current && !e.repeat) {
        ctrlHeld.current = true;
        voice.startListening();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Control' && ctrlHeld.current) {
        ctrlHeld.current = false;
        const text = voice.stopListening();
        if (text.trim()) wrappedSendMessage(text.trim());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [voice.isSupported, voice.startListening, voice.stopListening, wrappedSendMessage]);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header
        className="border-b px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--text-muted)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            CLA Knowledgebase
          </span>
          <NavTabs isAdmin={role === 'admin'} />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto flex-shrink-0 max-w-[60vw] sm:max-w-none">
          <CourseBadges selected={courseFilter} onSelect={setCourseFilter} />
          <div
            className="flex items-center rounded-full p-0.5 text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)' }}
          >
            {(['short', 'normal'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswerLength(opt)}
                className="px-3 py-1 rounded-full capitalize transition-colors"
                style={
                  answerLength === opt
                    ? { backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </header>

      <ChatMessages messages={messages} isLoading={isLoading} />

      <ChatInput
        onSend={wrappedSendMessage}
        isLoading={isLoading}
        voice={voice}
      />
    </div>
  );
}
