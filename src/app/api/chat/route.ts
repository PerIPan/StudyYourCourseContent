import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { retrieveContext, formatContextForPrompt, extractCitations } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';
import { streamText } from '@/lib/ai';
import { verifyCookie } from '@/lib/auth';

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
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { message, courseSlug, answerLength, history } = body;

  if (!message || typeof message !== 'string') {
    return new Response('Message required', { status: 400 });
  }

  let chunks: Awaited<ReturnType<typeof retrieveContext>> = [];
  try {
    chunks = await retrieveContext(message, courseSlug || undefined);
  } catch (err) {
    console.error('[Embedding/RAG error]', err);
    chunks = [];
  }

  const context = chunks.length > 0 ? formatContextForPrompt(chunks) : '';
  const citations = chunks.length > 0 ? extractCitations(chunks) : [];

  // Build conversation context from history (last 10 messages)
  const historyLines = Array.isArray(history)
    ? history
        .slice(-10)
        .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
        .join('\n\n')
    : '';

  const historyBlock = historyLines ? `\nPrevious conversation:\n${historyLines}\n\n---\n` : '';

  const userContent = context
    ? `Context from course materials:\n\n${context}\n\n---\n${historyBlock}Student question: ${message}`
    : `No course materials matched this question. Answer using general knowledge and clearly disclose that.\n${historyBlock}Student question: ${message}`;

  const systemPrompt = answerLength === 'short'
    ? CHAT_SYSTEM_PROMPT + '\n\nIMPORTANT: Keep your answer SHORT and concise — use bullet points, no more than 3-5 key points. Skip lengthy explanations. Get straight to the point.'
    : CHAT_SYSTEM_PROMPT;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'citations', data: citations })}\n\n`)
      );

      try {
        for await (const text of streamText(systemPrompt, userContent)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', data: text })}\n\n`)
          );
        }
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text', data: '\n\n⚠️ The AI service is temporarily busy. Please try again in a moment.' })}\n\n`)
        );
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
