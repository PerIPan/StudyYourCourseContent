import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

let _gemini: GoogleGenAI | null = null;
function getGemini() {
  if (!_gemini) _gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return _gemini;
}

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 });
  return _anthropic;
}

/** Streaming generation — Gemini primary, Claude fallback. Returns async iterable of text chunks. */
export async function* streamText(system: string, userContent: string): AsyncGenerator<string> {
  try {
    const response = await getGemini().models.generateContentStream({
      model: GEMINI_MODEL,
      contents: [userContent],
      config: {
        systemInstruction: system,
        maxOutputTokens: 2048,
      },
    });
    for await (const chunk of response) {
      if (chunk.text) yield chunk.text;
    }
  } catch (err) {
    console.error('[Gemini stream error, falling back to Claude]', err);
    const stream = getAnthropic().messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: userContent }],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}

/** Non-streaming generation — Gemini primary, Claude fallback. Returns full text. */
export async function generateText(system: string, userContent: string, maxTokens: number = 1500): Promise<string> {
  try {
    const response = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: [userContent],
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
      },
    });
    return response.text ?? '';
  } catch (err) {
    console.error('[Gemini generate error, falling back to Claude]', err);
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
