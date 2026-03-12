import { searchChunks } from './db';
import { embedText } from './embeddings';
import type { ChunkResult } from '@/types';

const PRIORITY_BOOST = 0.05;

export async function retrieveContext(
  question: string,
  courseSlug?: string,
  limit: number = 5
): Promise<ChunkResult[]> {
  const embedding = await embedText(question);
  const result = await searchChunks(embedding, courseSlug, 8);

  const rows = result.rows as ChunkResult[];

  const reranked = rows.map(row => ({
    ...row,
    similarity: row.priority === 'high'
      ? Math.min(1, row.similarity + PRIORITY_BOOST)
      : row.similarity,
  }));

  reranked.sort((a, b) => b.similarity - a.similarity);

  return reranked.slice(0, limit);
}

export function formatContextForPrompt(chunks: ChunkResult[]): string {
  return chunks.map((chunk, i) =>
    `[Source ${i + 1}: ${chunk.courseName} / Lecture ${chunk.lectureNumber} / ${chunk.filename}, p.${chunk.pageNumber}]\n${chunk.content}`
  ).join('\n\n---\n\n');
}

export function extractCitations(chunks: ChunkResult[]) {
  return chunks.map(chunk => ({
    courseName: chunk.courseName,
    lectureNumber: chunk.lectureNumber,
    filename: chunk.filename,
    pageNumber: chunk.pageNumber,
  }));
}
