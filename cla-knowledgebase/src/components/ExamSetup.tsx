'use client';

import { useState, useEffect } from 'react';

interface Course {
  id: string;
  name: string;
  slug: string;
}

interface ExamSetupProps {
  courseSlug: string | null;
  setCourseSlug: (slug: string | null) => void;
  questionType: string;
  setQuestionType: (t: string) => void;
  topicHint: string;
  setTopicHint: (t: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const QUESTION_TYPES = [
  { value: 'open-ended', label: 'Open-ended' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'compare-contrast', label: 'Compare & Contrast' },
];

const DIFFICULTY_LEVELS = [
  { value: 'normal', label: 'Normal' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'extreme', label: 'Extreme' },
];

export function ExamSetup({
  courseSlug, setCourseSlug,
  questionType, setQuestionType, topicHint, setTopicHint,
  difficulty, setDifficulty, onGenerate, loading,
}: ExamSetupProps) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(setCourses)
      .catch(() => {});
  }, []);

  const sectionLabel = {
    fontSize: '0.65rem',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  };

  function tagStyle(active: boolean) {
    return active
      ? {
          backgroundColor: 'var(--tag-active-bg)',
          color: 'var(--tag-active-text)',
          borderColor: 'var(--tag-active-border)',
        }
      : {
          backgroundColor: 'var(--tag-bg)',
          color: 'var(--tag-text)',
          borderColor: 'var(--tag-border)',
        };
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full overflow-y-auto">

      {/* Course selector */}
      <div className="mb-5">
        <div className="relative group flex items-center gap-1.5 mb-2">
          <div style={sectionLabel}>Course</div>
          <svg className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--border-strong)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span
            className="absolute top-full left-0 mt-1.5 px-2.5 py-1.5 text-[0.65rem] rounded-md w-52 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-page)' }}
          >
            Select a course to avoid cross-course questions
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCourseSlug(null)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors"
            style={
              courseSlug === null
                ? { backgroundColor: 'var(--tag-active-bg)', color: 'var(--tag-active-text)', borderColor: '#ef4444' }
                : tagStyle(false)
            }
          >
            All Courses
          </button>
          {courses.map(c => (
            <button
              key={c.slug}
              onClick={() => setCourseSlug(c.slug)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors"
              style={tagStyle(courseSlug === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Question type */}
      <div className="mb-6">
        <div className="relative group flex items-center gap-1.5 mb-2">
          <div style={sectionLabel}>Question Type</div>
          <svg className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--border-strong)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span
            className="absolute top-full left-0 mt-1.5 px-2.5 py-1.5 text-[0.65rem] rounded-md w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-page)' }}
          >
            The model picks a question but it has not been in class! Better use the topic field for direction.
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors"
              style={tagStyle(questionType === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic hint */}
      <div className="mb-6">
        <div className="relative group flex items-center gap-1.5 mb-2">
          <div style={sectionLabel}>Topic</div>
          <span className="text-[0.6rem]" style={{ color: 'var(--border-strong)' }}>(optional)</span>
          <svg className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--border-strong)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span
            className="absolute top-full left-0 mt-1.5 px-2.5 py-1.5 text-[0.65rem] rounded-md w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-page)' }}
          >
            Fill in to focus on a topic e.g. CMM, governance, resilience
          </span>
        </div>
        <textarea
          value={topicHint}
          onChange={e => setTopicHint(e.target.value)}
          placeholder="e.g. risk management, CMM, Governance..."
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm border-2 focus:outline-none transition-colors resize-none"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Complexity */}
      <div className="mb-6">
        <div className="mb-2" style={sectionLabel}>Complexity</div>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTY_LEVELS.map(d => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors"
              style={tagStyle(difficulty === d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="theme-accent-btn w-full rounded-lg py-3 font-semibold text-sm disabled:opacity-50 transition-colors"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
        onMouseEnter={e => ((e.currentTarget).style.backgroundColor = 'var(--accent-hover)')}
        onMouseLeave={e => ((e.currentTarget).style.backgroundColor = 'var(--accent)')}
      >
        {loading ? 'Generating...' : 'Generate Question'}
      </button>
    </div>
  );
}
