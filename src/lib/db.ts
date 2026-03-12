import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from '../../drizzle/schema';

export const db = drizzle(sql, { schema });

export async function initPgVector() {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
}

export async function createVectorColumn() {
  await sql`
    ALTER TABLE chunks
    ADD COLUMN IF NOT EXISTS embedding_vec vector(1536)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 10)
  `;
}

export async function searchChunks(
  queryEmbedding: number[],
  courseSlug?: string,
  limit: number = 8
) {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  if (courseSlug) {
    return sql`
      SELECT c.id, c.content, c.page_number, c.chunk_index,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name, co.slug as course_slug,
             1 - (c.embedding_vec <=> ${embeddingStr}::vector) as similarity
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE co.slug = ${courseSlug}
        AND 1 - (c.embedding_vec <=> ${embeddingStr}::vector) > 0.7
      ORDER BY c.embedding_vec <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
  }

  return sql`
    SELECT c.id, c.content, c.page_number, c.chunk_index,
           d.filename, d.lecture_number, d.priority,
           co.name as course_name, co.slug as course_slug,
           1 - (c.embedding_vec <=> ${embeddingStr}::vector) as similarity
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN courses co ON d.course_id = co.id
    WHERE 1 - (c.embedding_vec <=> ${embeddingStr}::vector) > 0.7
    ORDER BY c.embedding_vec <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;
}
