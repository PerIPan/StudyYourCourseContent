import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import { parseFile } from '@/lib/parsers';
import { chunkPages } from '@/lib/chunker';
import { embedBatch } from '@/lib/embeddings';
import { detectPriority } from '@/lib/priority';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (auth?.value !== 'admin') {
    return new Response('Admin access required', { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const courseId = formData.get('courseId') as string;
  const lectureNumber = parseInt(formData.get('lectureNumber') as string, 10);

  if (!file || !courseId || isNaN(lectureNumber)) {
    return NextResponse.json({ error: 'file, courseId, lectureNumber required' }, { status: 400 });
  }

  const filename = file.name;
  const fileType = filename.split('.').pop()?.toLowerCase() || '';

  if (!['pdf', 'pptx', 'docx'].includes(fileType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  // Delete existing document with same filename/course/lecture (re-upload)
  await sql`
    DELETE FROM documents
    WHERE course_id = ${courseId}
      AND lecture_number = ${lectureNumber}
      AND filename = ${filename}
  `;

  const buffer = Buffer.from(await file.arrayBuffer());
  const pages = await parseFile(buffer, fileType);
  const chunks = chunkPages(pages);
  const priority = detectPriority(filename);

  const docResult = await sql`
    INSERT INTO documents (course_id, lecture_number, filename, file_type, total_pages, chunk_count, priority)
    VALUES (${courseId}, ${lectureNumber}, ${filename}, ${fileType}, ${pages.length}, ${chunks.length}, ${priority})
    RETURNING id
  `;
  const documentId = docResult.rows[0].id;

  const texts = chunks.map(c => c.content);
  const embeddings = await embedBatch(texts);

  // Insert chunks with embeddings in batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const values = batch.map((chunk, j) => {
      const idx = i + j;
      const embeddingStr = `[${embeddings[idx].join(',')}]`;
      return `($1, $${j * 3 + 2}, '${embeddingStr}'::vector, $${j * 3 + 3}, $${j * 3 + 4})`;
    }).join(', ');

    const params: (string | number)[] = [documentId];
    for (const chunk of batch) {
      params.push(chunk.content, chunk.pageNumber, chunk.chunkIndex);
    }

    await sql.query(
      `INSERT INTO chunks (document_id, content, embedding_vec, page_number, chunk_index) VALUES ${values}`,
      params
    );
  }

  return NextResponse.json({
    documentId,
    filename,
    chunkCount: chunks.length,
    priority,
    totalPages: pages.length,
  });
}
