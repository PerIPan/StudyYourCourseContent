import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from '../../drizzle/schema';

export const db = drizzle(sql, { schema });

export async function searchChunks(
  queryEmbedding: number[],
  courseSlugs?: string[],
  limit: number = 8
) {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  if (courseSlugs && courseSlugs.length === 1) {
    return sql`
      SELECT c.id, c.content, c.page_number, c.chunk_index, c.course_slug,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name,
             1 - (c.embedding_vec <=> ${embeddingStr}::vector) as similarity
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE c.course_slug = ${courseSlugs[0]}
        AND 1 - (c.embedding_vec <=> ${embeddingStr}::vector) > 0.5
      ORDER BY c.embedding_vec <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
  }

  if (courseSlugs && courseSlugs.length === 2) {
    return sql`
      SELECT c.id, c.content, c.page_number, c.chunk_index, c.course_slug,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name,
             1 - (c.embedding_vec <=> ${embeddingStr}::vector) as similarity
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE (c.course_slug = ${courseSlugs[0]} OR c.course_slug = ${courseSlugs[1]})
        AND 1 - (c.embedding_vec <=> ${embeddingStr}::vector) > 0.5
      ORDER BY c.embedding_vec <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
  }

  return sql`
    SELECT c.id, c.content, c.page_number, c.chunk_index, c.course_slug,
           d.filename, d.lecture_number, d.priority,
           co.name as course_name,
           1 - (c.embedding_vec <=> ${embeddingStr}::vector) as similarity
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN courses co ON d.course_id = co.id
    WHERE 1 - (c.embedding_vec <=> ${embeddingStr}::vector) > 0.5
    ORDER BY c.embedding_vec <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;
}
