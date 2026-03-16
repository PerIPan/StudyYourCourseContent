'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavTabs } from '@/components/NavTabs';
import { ExamSetup } from '@/components/ExamSetup';
import { ExamQuestion } from '@/components/ExamQuestion';
import { ExamGrading } from '@/components/ExamGrading';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ExamQuestion as ExamQ, ExamGrade } from '@/types';

type ExamState = 'setup' | 'question' | 'grading';

export default function ExamPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<ExamState>('setup');
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState('open-ended');
  const [topicHint, setTopicHint] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<ExamQ | null>(null);
  const [currentGrade, setCurrentGrade] = useState<ExamGrade | null>(null);
  const [difficulty, setDifficulty] = useState('advanced');
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [skipped, setSkipped] = useState(false);
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
        body: JSON.stringify({ courseSlug, questionType, topicHint: topicHint.trim() || undefined, difficulty }),
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
    setSkipped(answer === '(show model answer)');
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
      setState('grading');
    } catch {
      setErrorMessage('Failed to grade answer.');
    } finally {
      setGrading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header
        className="border-b px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--text-muted)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            CLA Knowledgebase
          </span>
          <NavTabs isAdmin={role === 'admin'} />
        </div>
        <ThemeToggle />
      </header>

      {errorMessage && (
        <div
          className="mx-4 mt-3 rounded-lg px-4 py-3 text-sm flex items-center justify-between border"
          style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error-border)',
            color: 'var(--error-text)',
          }}
        >
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
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
          courseSlug={courseSlug} setCourseSlug={(slug) => {
            setCourseSlug(slug);
            if (slug === 'cla-foundations-i') setQuestionType('scenario');
          }}
          questionType={questionType} setQuestionType={setQuestionType}
          topicHint={topicHint} setTopicHint={setTopicHint}
          difficulty={difficulty} setDifficulty={setDifficulty}
          onGenerate={handleGenerate} loading={generating}
        />
      )}

      {state === 'question' && currentQuestion && (
        <ExamQuestion
          question={currentQuestion.question}
          questionType={currentQuestion.questionType}
          courseName={currentQuestion.courseName}
          lectureScope={currentQuestion.lectureScope}
          sources={currentQuestion.sources}
          onSubmit={handleSubmitAnswer}
          loading={grading}
        />
      )}

      {state === 'grading' && currentGrade && currentQuestion && (
        <ExamGrading
          grade={currentGrade}
          question={currentQuestion.question}
          skipped={skipped}
          onNext={handleGenerate}
          onBack={() => setState('setup')}
        />
      )}
    </div>
  );
}
