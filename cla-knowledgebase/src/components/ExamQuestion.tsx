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
  const [showTemplate, setShowTemplate] = useState(false);

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

      {/* Writing template toggle */}
      <button
        onClick={() => setShowTemplate(!showTemplate)}
        className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 mb-4 border text-sm font-medium transition-colors"
        style={{
          backgroundColor: showTemplate ? 'var(--accent-subtle)' : 'var(--bg-card)',
          borderColor: showTemplate ? 'var(--accent)' : 'var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>Answer Writing Guide (6-Step Academic Structure)</span>
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: showTemplate ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showTemplate && (
        <div
          className="theme-card rounded-lg p-4 mb-4 border text-sm leading-relaxed"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-card)',
            color: 'var(--text-secondary)',
          }}
        >
          <div className="space-y-3">
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>1. Direct Answer (Thesis Statement)</span>
              <p className="mt-1">Begin with a one-sentence answer. Shows clarity and confidence.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;In essence, this question can be answered as follows: &hellip;&rdquo;</p>
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>2. Define Key Concepts</span>
              <p className="mt-1">Briefly explain central idea(s) using precise, academic language.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;[Concept] refers to &hellip; and is significant because &hellip;&rdquo;</p>
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>3. Core Argument (2&ndash;3 Points)</span>
              <p className="mt-1">Each point = claim + reason + brief explanation. Keep paragraphs short and logical.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;Firstly, &hellip; because &hellip; This matters as &hellip;&rdquo;</p>
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>4. Apply to Context</span>
              <p className="mt-1">Use a theoretical mechanism, process, or real-world example.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;This can be illustrated by &hellip; which demonstrates that &hellip;&rdquo;</p>
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>5. Mini-Evaluation (Optional but High-Value)</span>
              <p className="mt-1">Add a critical perspective: limitations, trade-offs, or conditions.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;However, this depends on &hellip;&rdquo;</p>
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>6. Concluding Sentence</span>
              <p className="mt-1">One sentence tying your argument together.</p>
              <p className="italic mt-1" style={{ color: 'var(--text-muted)' }}>&ldquo;Taken together, these elements show that &hellip;&rdquo;</p>
            </div>
          </div>
        </div>
      )}

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
