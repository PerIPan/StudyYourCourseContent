'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [autoReadAloud, setAutoReadAloud] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function loadVoices() {
      const available = window.speechSynthesis.getVoices();
      if (available.length === 0) return;
      setVoices(available);
      setSelectedVoiceURI(prev => {
        if (prev) return prev;
        const preferred = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona',
          'Microsoft Zira', 'Google UK English Female', 'Google US English'];
        const english = available.filter(v => v.lang.startsWith('en'));
        const pick = english.find(v => preferred.some(p => v.name.includes(p)))
          || english.find(v => /female/i.test(v.name))
          || english[0];
        return pick?.voiceURI || '';
      });
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, []);

  const stopListening = useCallback((): string => {
    recognitionRef.current?.stop();
    setIsListening(false);
    return transcript;
  }, [transcript]);

  const speak = useCallback((text: string) => {
    if (!autoReadAloud) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const v = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (v) utterance.voice = v;
    window.speechSynthesis.speak(utterance);
  }, [autoReadAloud, voices, selectedVoiceURI]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    autoReadAloud,
    setAutoReadAloud,
    isSupported,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
  };
}
