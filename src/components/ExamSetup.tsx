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
  questionType, setQuestionType, onGenerate, loading, sessionScore,
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
