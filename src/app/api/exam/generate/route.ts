import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { EXAM_GENERATE_PROMPT, buildExamGenerateMessages } from '@/lib/prompts';
import { formatContextForPrompt } from '@/lib/rag';
import { generateText } from '@/lib/ai';
import type { ChunkResult } from '@/types';

// Server-side store for rubrics + source chunks (prevents leaking to client)
export const examStore = new Map<string, { rubric: string; sourceChunks: ChunkResult[]; expiresAt: number }>();

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { courseSlug, questionType, topicHint } = await request.json();

  let result;
  if (courseSlug) {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index, c.course_slug,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE c.course_slug = ${courseSlug}
      ORDER BY RANDOM()
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
      ORDER BY RANDOM()
      LIMIT 5
    `;
  }

  const chunks = result.rows as unknown as ChunkResult[];

  if (chunks.length === 0) {
    return NextResponse.json({ error: 'No content available for this scope' }, { status: 404 });
  }

  const context = formatContextForPrompt(chunks);
  const userMessage = buildExamGenerateMessages(context, questionType, topicHint);

  const text = await generateText(EXAM_GENERATE_PROMPT, userMessage, 1024);

  try {
    const parsed = JSON.parse(text);

    const questionId = crypto.randomUUID();
    examStore.set(questionId, {
      rubric: parsed.rubric,
      sourceChunks: chunks,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    return NextResponse.json({
      questionId,
      question: parsed.question,
      questionType,
      courseName: chunks[0].course_name,
      lectureScope: null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
