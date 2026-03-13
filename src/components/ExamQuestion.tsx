'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SourceCitationBlock } from './SourceCitation';
import type { SourceCitation } from '@/types';

interface ExamQuestionProps {
  question: string;
  questionType: string;
  courseName: string;
  lectureScope: number | null;
  sources: SourceCitation[];
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function ExamQuestion({ question, questionType, courseName, lectureScope, sources, onSubmit, loading }: ExamQuestionProps) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
      {/* Meta badges */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-text)',
          }}
        >
          {courseName}
        </span>
        {lectureScope && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Lecture {lectureScope}
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{questionType}</span>
      </div>

      {/* Question card */}
      <div
        className="theme-card rounded-lg p-4 mb-4 border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase" style={{ color: 'var(--accent-text)' }}>
            Question
          </div>
          <button
            onClick={() => onSubmit('(show model answer)')}
            disabled={loading}
            className="text-xs px-3 py-1 rounded-full border transition-colors disabled:opacity-50"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {loading ? 'Loading...' : 'Model Answer'}
          </button>
        </div>
        <div
          className="prose prose-sm max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-2 prose-ol:my-2 prose-li:text-[0.95rem]"
          style={{
            ['--tw-prose-body' as string]: 'var(--prose-body)',
            ['--tw-prose-headings' as string]: 'var(--prose-headings)',
            ['--tw-prose-bold' as string]: 'var(--prose-strong)',
          }}
        >
          <style>{`
            .prose p, .prose li { color: var(--prose-body); }
            .prose strong { color: var(--prose-strong); }
            .prose h1, .prose h2, .prose h3, .prose h4 { color: var(--prose-headings); }
          `}</style>
          <ReactMarkdown>{question}</ReactMarkdown>
        </div>
        <SourceCitationBlock sources={sources} />
      </div>

      {/* Answer card */}
      <div
        className="theme-card rounded-lg p-4 mb-4 border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
          Your Answer
        </div>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={12}
          className="w-full rounded-lg p-3 text-sm border focus:outline-none transition-colors resize-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <button
        onClick={() => onSubmit(answer)}
        disabled={loading || !answer.trim()}
        className="theme-accent-btn w-full rounded-lg py-3 font-semibold text-sm disabled:opacity-50 transition-colors"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
        onMouseEnter={e => ((e.currentTarget).style.backgroundColor = 'var(--accent-hover)')}
        onMouseLeave={e => ((e.currentTarget).style.backgroundColor = 'var(--accent)')}
      >
        {loading ? 'Grading...' : 'Submit Your Answer for Feedback'}
      </button>
    </div>
  );
}
