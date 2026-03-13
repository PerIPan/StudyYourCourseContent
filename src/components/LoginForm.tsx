'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(password);
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--login-gradient)' }}
    >
      <div className="text-center w-80">
        <svg
          className="w-14 h-14 mx-auto mb-3"
          style={{ color: 'var(--accent)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          CLA Knowledgebase
        </h1>
        <div className="mb-8" />

        <form
          onSubmit={handleSubmit}
          className="theme-card rounded-xl p-6 border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter class password"
            className="theme-input w-full border rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
              // ring color via focus style — handled via accent
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            autoFocus
          />
          {error && (
            <p className="text-sm mb-3" style={{ color: 'var(--error-text)' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="theme-accent-btn w-full rounded-lg py-3 font-semibold text-sm disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-on-accent)',
            }}
            onMouseEnter={e => ((e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)')}
            onMouseLeave={e => ((e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent)')}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
