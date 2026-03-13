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
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-center">
        <p className="text-emerald-700 font-semibold text-sm">Thank you for submitting!</p>
        <p className="text-emerald-600 text-xs mt-1">Here is your feedback and a model answer to help you learn.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Question</div>
        <div className="prose prose-sm prose-slate max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:text-slate-800">
          <ReactMarkdown>{question}</ReactMarkdown>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-emerald-600 uppercase mb-3">Feedback</div>

        <div className="mb-3">
          <strong className="text-emerald-600 text-sm">What you got right:</strong>
          <div className="prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <ReactMarkdown>{grade.correct}</ReactMarkdown>
          </div>
        </div>
        <div>
          <strong className="text-amber-600 text-sm">Areas to improve:</strong>
          <div className="prose prose-sm prose-slate max-w-none prose-p:my-1.5 prose-p:text-[0.95rem] prose-p:leading-relaxed mt-1">
            <ReactMarkdown>{grade.missing}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Model Answer</div>
        <div className="prose prose-sm prose-slate max-w-none prose-p:my-2 prose-p:text-[0.95rem] prose-p:leading-relaxed prose-strong:text-slate-800 prose-ul:my-2 prose-ol:my-2">
          <ReactMarkdown>{grade.modelAnswer}</ReactMarkdown>
        </div>
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
