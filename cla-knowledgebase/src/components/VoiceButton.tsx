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
      type="button"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={isListening ? onMouseUp : undefined}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      onTouchCancel={onMouseUp}
      aria-label="Hold to talk"
      title="Hold to talk"
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
        isListening ? 'animate-pulse' : ''
      }`}
      style={
        isListening
          ? {
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              borderColor: 'rgba(239,68,68,0.4)',
            }
          : {
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-muted)',
              borderColor: 'var(--border)',
            }
      }
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
