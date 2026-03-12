import 'dotenv/config';
import { sql } from '@vercel/postgres';

async function seed() {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      course_id UUID REFERENCES courses(id) NOT NULL,
      lecture_number INT NOT NULL,
      filename VARCHAR(500) NOT NULL,
      file_type VARCHAR(10) NOT NULL,
      total_pages INT DEFAULT 0 NOT NULL,
      chunk_count INT DEFAULT 0 NOT NULL,
      priority VARCHAR(10) DEFAULT 'normal' NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS documents_course_id_idx ON documents(course_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chunks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL,
      embedding_vec vector(1536),
      page_number INT NOT NULL,
      chunk_index INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks(document_id)`;
  await sql`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON chunks USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 10)
  `;

  // Seed courses
  await sql`
    INSERT INTO courses (name, slug) VALUES
      ('Foundations 1', 'foundations'),
      ('Strategy & Leadership', 'strategy'),
      ('Threat Landscape', 'threat-landscape')
    ON CONFLICT (slug) DO NOTHING
  `;

  console.log('Seeded courses and created tables');
}

seed().catch(console.error);
