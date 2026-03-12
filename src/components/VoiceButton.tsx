'use client';

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

export function VoiceButton({ isListening, isSupported, onMouseDown, onMouseUp }: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
        isListening
          ? 'bg-red-100 text-red-500 ring-2 ring-red-300 animate-pulse'
          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
      }`}
      title="Hold to talk"
    >
      🎤
    </button>
  );
}
