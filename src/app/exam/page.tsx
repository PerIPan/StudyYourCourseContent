'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavTabs } from '@/components/NavTabs';
import { ExamSetup } from '@/components/ExamSetup';
import { ExamQuestion } from '@/components/ExamQuestion';
import { ExamGrading } from '@/components/ExamGrading';
import type { ExamQuestion as ExamQ, ExamGrade } from '@/types';

type ExamState = 'setup' | 'question' | 'grading';

export default function ExamPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<ExamState>('setup');
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState('open-ended');
  const [currentQuestion, setCurrentQuestion] = useState<ExamQ | null>(null);
  const [currentGrade, setCurrentGrade] = useState<ExamGrade | null>(null);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sessionScore, setSessionScore] = useState({ total: 0, count: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !role) router.push('/');
  }, [loading, role, router]);

  async function handleGenerate() {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, questionType }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setCurrentQuestion(data);
      setState('question');
    } catch {
      setErrorMessage('Failed to generate question. Make sure content is uploaded.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitAnswer(answer: string) {
    if (!currentQuestion) return;
    setGrading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/exam/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          question: currentQuestion.question,
          studentAnswer: answer,
        }),
      });
      if (!res.ok) throw new Error('Failed to grade');
      const grade = await res.json();
      setCurrentGrade(grade);
      setSessionScore(prev => ({ total: prev.total + grade.score, count: prev.count + 1 }));
      setState('grading');
    } catch {
      setErrorMessage('Failed to grade answer.');
    } finally {
      setGrading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="font-semibold text-slate-800 text-sm">CLA Knowledgebase</span>
        <NavTabs isAdmin={role === 'admin'} />
      </header>

      {errorMessage && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-3 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {state === 'setup' && (
        <ExamSetup
          courseSlug={courseSlug} setCourseSlug={setCourseSlug}
          questionType={questionType} setQuestionType={setQuestionType}
          onGenerate={handleGenerate} loading={generating}
          sessionScore={sessionScore}
        />
      )}

      {state === 'question' && currentQuestion && (
        <ExamQuestion
          question={currentQuestion.question}
          questionType={currentQuestion.questionType}
          courseName={currentQuestion.courseName}
          lectureScope={currentQuestion.lectureScope}
          onSubmit={handleSubmitAnswer}
          loading={grading}
        />
      )}

      {state === 'grading' && currentGrade && currentQuestion && (
        <ExamGrading
          grade={currentGrade}
          question={currentQuestion.question}
          onNext={handleGenerate}
          onBack={() => setState('setup')}
        />
      )}
    </div>
  );
}
