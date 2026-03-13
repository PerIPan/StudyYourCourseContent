import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { EXAM_GENERATE_PROMPT, buildExamGenerateMessages } from '@/lib/prompts';
import { formatContextForPrompt } from '@/lib/rag';
import { generateText, sanitizeLLMJson } from '@/lib/ai';
import { verifyCookie } from '@/lib/auth';
import { extractCitations } from '@/lib/rag';
import type { ChunkResult } from '@/types';

const VALID_QUESTION_TYPES = ['open-ended', 'scenario', 'compare-contrast'];
const VALID_DIFFICULTIES = ['normal', 'advanced', 'extreme'];

// Server-side store for rubrics + source chunks (prevents leaking to client)
export const examStore = new Map<string, { rubric: string; sourceChunks: ChunkResult[]; expiresAt: number }>();

// Periodic cleanup of expired entries
function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of examStore) {
    if (value.expiresAt < now) examStore.delete(key);
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth || !verifyCookie(auth.value)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { courseSlug, questionType, topicHint, difficulty } = body;

  // Input validation
  const qType = VALID_QUESTION_TYPES.includes(questionType) ? questionType : 'open-ended';
  const diff = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : 'normal';
  const topic = typeof topicHint === 'string' ? topicHint.slice(0, 200).trim() : '';

  let result;
  if (courseSlug && typeof courseSlug === 'string') {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index, c.course_slug,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE c.course_slug = ${courseSlug}
      ORDER BY RANDOM() * CASE WHEN d.priority = 'high' THEN 3 ELSE 1 END DESC
      LIMIT 5
    `;
  } else {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index, c.course_slug,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      ORDER BY RANDOM() * CASE WHEN d.priority = 'high' THEN 3 ELSE 1 END DESC
      LIMIT 5
    `;
  }

  const chunks = result.rows as unknown as ChunkResult[];

  if (chunks.length === 0) {
    return NextResponse.json({ error: 'No content available for this scope' }, { status: 404 });
  }

  const context = formatContextForPrompt(chunks);
  const detectedSlug = courseSlug || chunks[0]?.course_slug || undefined;
  const userMessage = buildExamGenerateMessages(context, qType, topic || undefined, diff, detectedSlug);

  const text = await generateText(EXAM_GENERATE_PROMPT, userMessage, 2048);

  try {
    const parsed = JSON.parse(sanitizeLLMJson(text));

    // Cleanup expired entries before adding new ones
    cleanupExpired();

    const questionId = crypto.randomUUID();
    examStore.set(questionId, {
      rubric: parsed.rubric,
      sourceChunks: chunks,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const citations = extractCitations(chunks);

    return NextResponse.json({
      questionId,
      question: parsed.question,
      questionType: qType,
      courseName: chunks[0].course_name,
      lectureScope: null,
      sources: citations,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
