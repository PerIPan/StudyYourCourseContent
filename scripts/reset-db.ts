import path from 'path';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function reset() {
  const client = await pool.connect();
  try {
    await client.query('DROP TABLE IF EXISTS chunks CASCADE');
    await client.query('DROP TABLE IF EXISTS documents CASCADE');
    await client.query('DROP TABLE IF EXISTS courses CASCADE');
    console.log('Tables dropped');

    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    await client.query(`
      CREATE TABLE courses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE documents (
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
    `);

    await client.query('CREATE INDEX documents_course_id_idx ON documents(course_id)');

    await client.query(`
      CREATE TABLE chunks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        embedding_vec vector(768),
        page_number INT NOT NULL,
        chunk_index INT NOT NULL,
        course_slug VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      )
    `);

    await client.query('CREATE INDEX chunks_document_id_idx ON chunks(document_id)');
    await client.query(`
      CREATE INDEX chunks_embedding_idx
      ON chunks USING hnsw (embedding_vec vector_cosine_ops)
    `);

    console.log('Tables recreated with vector(768)');
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch(console.error);
