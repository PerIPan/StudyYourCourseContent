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
  onGenerate: () => void;
  loading: boolean;
  sessionScore: { total: number; count: number };
}

const QUESTION_TYPES = [
  { value: 'open-ended', label: 'Open-ended' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'compare-contrast', label: 'Compare & Contrast' },
];

export function ExamSetup({
  courseSlug, setCourseSlug,
  questionType, setQuestionType, topicHint, setTopicHint, onGenerate, loading, sessionScore,
}: ExamSetupProps) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(setCourses)
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-5">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Course</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCourseSlug(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
              courseSlug === null
                ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            All Courses
          </button>
          {courses.map(c => (
            <button
              key={c.slug}
              onClick={() => setCourseSlug(c.slug)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                courseSlug === c.slug
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Question Type</div>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                questionType === t.value
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="text-xs font-semibold text-slate-400 uppercase">Topic</div>
          <span className="text-[0.6rem] text-slate-300">(optional)</span>
          <span className="relative group">
            <svg className="w-3.5 h-3.5 text-slate-300 cursor-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[0.65rem] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Focus the question on a specific topic, e.g. &quot;risk management&quot; or &quot;zero trust&quot; | hope it works :)
            </span>
          </span>
        </div>
        <input
          type="text"
          value={topicHint}
          onChange={e => setTopicHint(e.target.value)}
          placeholder="e.g. risk management, zero trust, incident response..."
          className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Question'}
      </button>

      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-sm text-indigo-700">Exam Preparation Tips</p>
        <p>Expect a mix of question types: some require <strong>short, direct answers</strong> (Knowledge / Comprehension), while others demand <strong>longer, structured responses</strong> demonstrating Analysis, Synthesis, and Evaluation.</p>
        <p>For open-ended questions, there is no single perfect answer — variations are acceptable and encouraged, provided they are <strong>well-reasoned and grounded</strong> in the key concepts from your lectures and reading materials.</p>
        <p>Your grade depends on your ability to <strong>interpret the question accurately</strong>, analyse the given situation, and <strong>effectively apply the theoretical concepts</strong> you have learned.</p>
      </div>

      {sessionScore.count > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm text-slate-500">Session Score</span>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-500">{sessionScore.count} questions</span>
            <span className="text-lg font-bold text-emerald-600">
              {(sessionScore.total / sessionScore.count).toFixed(1)} / 10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
