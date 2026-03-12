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
  const [lectureNumber, setLectureNumber] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState('open-ended');
  const [currentQuestion, setCurrentQuestion] = useState<ExamQ | null>(null);
  const [currentGrade, setCurrentGrade] = useState<ExamGrade | null>(null);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sessionScore, setSessionScore] = useState({ total: 0, count: 0 });

  useEffect(() => {
    if (!loading && !role) router.push('/');
  }, [loading, role, router]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lectureNumber, questionType }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setCurrentQuestion(data);
      setState('question');
    } catch {
      alert('Failed to generate question. Make sure content is uploaded.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitAnswer(answer: string) {
    if (!currentQuestion) return;
    setGrading(true);
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
      alert('Failed to grade answer.');
    } finally {
      setGrading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <span className="text-xl">🛡️</span>
        <span className="font-semibold text-slate-800 text-sm">CLA Knowledgebase</span>
        <NavTabs isAdmin={role === 'admin'} />
      </header>

      {state === 'setup' && (
        <ExamSetup
          courseSlug={courseSlug} setCourseSlug={setCourseSlug}
          lectureNumber={lectureNumber} setLectureNumber={setLectureNumber}
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
