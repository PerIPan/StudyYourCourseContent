'use client';

import { useState } from 'react';

interface ExamQuestionProps {
  question: string;
  questionType: string;
  courseName: string;
  lectureScope: number | null;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function ExamQuestion({ question, questionType, courseName, lectureScope, onSubmit, loading }: ExamQuestionProps) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">{courseName}</span>
        {lectureScope && <span className="text-xs text-slate-500">Lecture {lectureScope}</span>}
        <span className="text-xs text-slate-400">{questionType}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Question</div>
        <p className="text-sm text-slate-800 leading-relaxed">{question}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Your Answer</div>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        onClick={() => onSubmit(answer)}
        disabled={loading || !answer.trim()}
        className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Grading...' : 'Submit Answer'}
      </button>
    </div>
  );
}
