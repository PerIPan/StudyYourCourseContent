import { searchChunks } from './db';
import { embedText } from './embeddings';
import type { ChunkResult } from '@/types';

const PRIORITY_BOOST = 0.05;

export async function retrieveContext(
  question: string,
  courseSlugs?: string[],
  limit: number = 5
): Promise<ChunkResult[]> {
  const embedding = await embedText(question);
  const result = await searchChunks(embedding, courseSlugs, 8);

  const rows = result.rows as ChunkResult[];

  const reranked = rows.map(row => ({
    ...row,
    similarity: row.priority === 'high'
      ? Math.min(1, (row.similarity ?? 0) + PRIORITY_BOOST)
      : (row.similarity ?? 0),
  }));

  reranked.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));

  return reranked.slice(0, limit);
}

export function formatContextForPrompt(chunks: ChunkResult[]): string {
  return chunks.map((chunk, i) =>
    `[Source ${i + 1}: ${chunk.course_name} / ${chunk.filename}, p.${chunk.page_number}]\n${chunk.content}`
  ).join('\n\n---\n\n');
}

export function extractCitations(chunks: ChunkResult[]) {
  return chunks.map(chunk => ({
    courseName: chunk.course_name,
    lectureNumber: chunk.lecture_number,
    filename: chunk.filename,
    pageNumber: chunk.page_number,
  }));
}
