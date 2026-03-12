import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EXAM_GRADE_PROMPT } from '@/lib/prompts';
import { formatContextForPrompt, extractCitations } from '@/lib/rag';
import { generateText } from '@/lib/ai';
import { examStore } from '../generate/route';
import type { ChunkResult } from '@/types';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { questionId, question, studentAnswer } = await request.json();

  if (!questionId || !question || !studentAnswer) {
    return NextResponse.json({ error: 'questionId, question, studentAnswer required' }, { status: 400 });
  }

  const stored = examStore.get(questionId);
  if (!stored || stored.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Question expired. Generate a new one.' }, { status: 410 });
  }

  const { rubric, sourceChunks } = stored;
  examStore.delete(questionId);

  const context = formatContextForPrompt(sourceChunks as ChunkResult[]);
  const citations = extractCitations(sourceChunks as ChunkResult[]);

  const text = await generateText(
    EXAM_GRADE_PROMPT,
    `Question: ${question}\n\nRubric: ${rubric}\n\nSource material:\n${context}\n\nStudent answer:\n${studentAnswer}`,
  );

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({
      score: parsed.score,
      correct: parsed.correct,
      missing: parsed.missing,
      modelAnswer: parsed.modelAnswer,
      sources: citations,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to grade answer' }, { status: 500 });
  }
}
