export interface TextChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

interface PageText {
  pageNumber: number;
  text: string;
}

const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

export function chunkPages(pages: PageText[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let buffer = '';
  let currentPage = pages[0]?.pageNumber ?? 1;
  let chunkIndex = 0;

  for (const page of pages) {
    const sentences = splitSentences(page.text);

    for (const sentence of sentences) {
      buffer += (buffer ? ' ' : '') + sentence;

      if (buffer.length >= TARGET_CHARS) {
        chunks.push({
          content: buffer.trim(),
          pageNumber: currentPage,
          chunkIndex: chunkIndex++,
        });

        const overlapStart = Math.max(0, buffer.length - OVERLAP_CHARS);
        buffer = buffer.slice(overlapStart);
        currentPage = page.pageNumber;
      }
    }
  }

  if (buffer.trim().length > 50) {
    chunks.push({
      content: buffer.trim(),
      pageNumber: currentPage,
      chunkIndex: chunkIndex,
    });
  }

  return chunks;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}
