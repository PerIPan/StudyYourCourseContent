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
  const scoreColor = grade.score >= 7 ? 'text-emerald-600 bg-emerald-50' :
    grade.score >= 4 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Question</div>
        <div className="prose prose-sm prose-slate max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:text-slate-800">
          <ReactMarkdown>{question}</ReactMarkdown>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Grading</div>
          <div className={`text-lg font-bold px-3 py-1 rounded-lg ${scoreColor}`}>
            {grade.score} / 10
          </div>
        </div>

        <div className="mb-3">
          <strong className="text-emerald-600 text-sm">Correct:</strong>
          <div className="prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <ReactMarkdown>{grade.correct}</ReactMarkdown>
          </div>
        </div>
        <div>
          <strong className="text-amber-600 text-sm">Missing:</strong>
          <div className="prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <ReactMarkdown>{grade.missing}</ReactMarkdown>
          </div>
        </div>

        <details className="mt-4">
          <summary className="text-sm text-indigo-500 cursor-pointer font-semibold">View model answer</summary>
          <div className="mt-2 p-3 bg-slate-50 rounded-lg prose prose-sm prose-slate max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:text-slate-800 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown>{grade.modelAnswer}</ReactMarkdown>
          </div>
        </details>

        <SourceCitationBlock sources={grade.sources} />
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg py-3 text-sm">
          Back to Setup
        </button>
        <button onClick={onNext} className="flex-1 bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 transition-colors">
          Next Question
        </button>
      </div>
    </div>
  );
}
