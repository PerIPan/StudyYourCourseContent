'use client';

import { useTheme, type Theme } from './ThemeProvider';

interface ThemeOption {
  value: Theme;
  label: string;
  /** Inline SVG icon as a React element */
  icon: React.ReactNode;
  title: string;
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/** Flame icon for the Ember/Surprise theme */
const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light',    label: 'Light',    icon: <SunIcon />,   title: 'Light mode' },
  { value: 'dark',     label: 'Dark',     icon: <MoonIcon />,  title: 'Dark mode' },
  { value: 'surprise', label: 'Ember',    icon: <FlameIcon />, title: 'Ember mode — warm & cozy' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center rounded-full border p-0.5 gap-0.5"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-muted)',
      }}
      role="group"
      aria-label="Choose theme"
    >
      {THEME_OPTIONS.map(opt => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.title}
            aria-pressed={isActive}
            className={[
              'flex items-center gap-1 px-2 py-1 rounded-full text-[0.65rem] font-semibold',
              'transition-all duration-200 select-none',
              isActive ? 'theme-accent-btn' : '',
            ].join(' ')}
            style={
              isActive
                ? {
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-on-accent)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                  }
            }
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
