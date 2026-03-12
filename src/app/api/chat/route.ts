import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { retrieveContext, formatContextForPrompt, extractCitations } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';
import { streamText } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message, courseSlug } = await request.json();

  if (!message || typeof message !== 'string') {
    return new Response('Message required', { status: 400 });
  }

  const chunks = await retrieveContext(message, courseSlug || undefined);

  const context = chunks.length > 0 ? formatContextForPrompt(chunks) : '';
  const citations = chunks.length > 0 ? extractCitations(chunks) : [];

  const userContent = context
    ? `Context from course materials:\n\n${context}\n\n---\n\nStudent question: ${message}`
    : `No course materials matched this question. Answer using general knowledge and clearly disclose that.\n\nStudent question: ${message}`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'citations', data: citations })}\n\n`)
      );

      try {
        for await (const text of streamText(CHAT_SYSTEM_PROMPT, userContent)) {
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
