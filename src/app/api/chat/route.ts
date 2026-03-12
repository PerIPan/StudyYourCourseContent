import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { retrieveContext, formatContextForPrompt, extractCitations } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

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

  const stream = getAnthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'citations', data: citations })}\n\n`)
      );

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', data: event.delta.text })}\n\n`)
          );
        }
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
