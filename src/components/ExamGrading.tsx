'use client';

import ReactMarkdown from 'react-markdown';
import { SourceCitationBlock } from './SourceCitation';
import type { ExamGrade } from '@/types';

interface ExamGradingProps {
  grade: ExamGrade;
  question: string;
  onNext: () => void;
  onBack: () => void;
}

export function ExamGrading({ grade, question, onNext, onBack }: ExamGradingProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
      {/* Success banner */}
      <div
        className="rounded-lg p-4 mb-4 text-center border"
        style={{
          backgroundColor: 'var(--success-bg)',
          borderColor: 'var(--success-border)',
          color: 'var(--success-text)',
        }}
      >
        <p className="font-semibold text-sm">Thank you for submitting!</p>
        <p className="text-xs mt-1 opacity-80">Here is your feedback and a model answer to help you learn.</p>
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
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--accent-text)' }}>
          Question
        </div>
        <div
          className="prose prose-sm max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:font-semibold"
        >
          <style>{`
            .prose p, .prose li { color: var(--prose-body); }
            .prose strong { color: var(--prose-strong); }
          `}</style>
          <ReactMarkdown>{question}</ReactMarkdown>
        </div>
      </div>

      {/* Feedback card */}
      <div
        className="theme-card rounded-lg p-4 mb-4 border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--success-text)' }}>
          Feedback
        </div>

        <div className="mb-3">
          <strong className="text-sm" style={{ color: 'var(--success-text)' }}>
            What you got right:
          </strong>
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <style>{`
              .prose p, .prose li { color: var(--prose-body); }
              .prose strong { color: var(--prose-strong); }
            `}</style>
            <ReactMarkdown>{grade.correct}</ReactMarkdown>
          </div>
        </div>

        <div>
          <strong className="text-sm" style={{ color: 'var(--warning-text)' }}>
            Areas to improve:
          </strong>
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <style>{`
              .prose p, .prose li { color: var(--prose-body); }
              .prose strong { color: var(--prose-strong); }
            `}</style>
            <ReactMarkdown>{grade.missing}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Model answer card */}
      <div
        className="theme-card rounded-lg p-4 mb-4 border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--accent-text)' }}>
          Model Answer
        </div>
        <div
          className="prose prose-sm max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-2 prose-ol:my-2"
        >
          <style>{`
            .prose p, .prose li { color: var(--prose-body); }
            .prose strong { color: var(--prose-strong); }
            .prose h1, .prose h2, .prose h3, .prose h4 { color: var(--prose-headings); }
          `}</style>
          <ReactMarkdown>{grade.modelAnswer}</ReactMarkdown>
        </div>
        <SourceCitationBlock sources={grade.sources} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg py-3 text-sm border transition-colors"
          style={{
            backgroundColor: 'var(--btn-secondary-bg)',
            color: 'var(--btn-secondary-text)',
            borderColor: 'var(--btn-secondary-border)',
          }}
        >
          Back to Setup
        </button>
        <button
          onClick={onNext}
          className="theme-accent-btn flex-1 rounded-lg py-3 font-semibold text-sm transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          onMouseEnter={e => ((e.currentTarget).style.backgroundColor = 'var(--accent-hover)')}
          onMouseLeave={e => ((e.currentTarget).style.backgroundColor = 'var(--accent)')}
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
