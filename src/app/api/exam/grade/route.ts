import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { EXAM_GRADE_PROMPT } from '@/lib/prompts';
import { formatContextForPrompt, extractCitations } from '@/lib/rag';
import { examStore } from '../generate/route';
import type { ChunkResult } from '@/types';

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

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

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: EXAM_GRADE_PROMPT,
    messages: [{
      role: 'user',
      content: `Question: ${question}\n\nRubric: ${rubric}\n\nSource material:\n${context}\n\nStudent answer:\n${studentAnswer}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

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
