/**
 * Local upload script — bypasses Vercel's payload size limit.
 *
 * Usage:
 *   npx tsx scripts/upload-folder.ts /path/to/folder
 *
 * The folder name becomes the course name.
 * All PDF/PPTX/DOCX files inside are processed and uploaded to the DB.
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

// Load .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUPPORTED = new Set(['pdf', 'pptx', 'docx']);
const TARGET_CHARS = 2000;
const OVERLAP_CHARS = 200;
const BATCH_SIZE = 20;

const HIGH_PRIORITY_PATTERNS = [/must[- ]read/i, /important/i, /slides/i, /exam/i, /summary/i, /use case/i];

// ── Parsers ──────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.pages
    .map((p: { num: number; text: string }) => ({ pageNumber: p.num, text: p.text.trim() }))
    .filter((p: { text: string }) => p.text.length > 0);
}

async function parseDocx(buffer: Buffer) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ buffer });
  return [{ pageNumber: 1, text: result.value }];
}

async function parsePptx(buffer: Buffer) {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries()
    .filter(e => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  return entries.map((entry, i) => {
    const xml = entry.getData().toString('utf-8');
    // Extract text from <a:t> tags
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map(m => m[1]);
    return { pageNumber: i + 1, text: texts.join(' ').trim() };
  }).filter(p => p.text.length > 0);
}

async function parseFile(buffer: Buffer, ext: string) {
  switch (ext) {
    case 'pdf': return parsePdf(buffer);
    case 'docx': return parseDocx(buffer);
    case 'pptx': return parsePptx(buffer);
    default: throw new Error(`Unsupported: ${ext}`);
  }
}

// ── Chunker ──────────────────────────────────────────────────────

function chunkPages(pages: { pageNumber: number; text: string }[]) {
  const chunks: { content: string; pageNumber: number; chunkIndex: number }[] = [];
  let buffer = '';
  let currentPage = pages[0]?.pageNumber ?? 1;
  let chunkIndex = 0;

  for (const page of pages) {
    const sentences = page.text.replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      buffer += (buffer ? ' ' : '') + sentence;
      if (buffer.length >= TARGET_CHARS) {
        chunks.push({ content: buffer.trim(), pageNumber: currentPage, chunkIndex: chunkIndex++ });
        buffer = buffer.slice(Math.max(0, buffer.length - OVERLAP_CHARS));
        currentPage = page.pageNumber;
      }
    }
  }
  if (buffer.trim().length > 50) {
    chunks.push({ content: buffer.trim(), pageNumber: currentPage, chunkIndex });
  }
  return chunks;
}

// ── Embeddings ───────────────────────────────────────────────────

async function embedBatch(texts: string[]) {
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: batch });
    all.push(...res.data.map(d => d.embedding));
  }
  return all;
}

// ── Priority ─────────────────────────────────────────────────────

function detectPriority(filename: string): 'high' | 'normal' {
  if (/\.pptx$/i.test(filename)) return 'high';
  for (const p of HIGH_PRIORITY_PATTERNS) if (p.test(filename)) return 'high';
  return 'normal';
}

// ── Main ─────────────────────────────────────────────────────────

async function uploadCourse(resolved: string) {
  const courseName = path.basename(resolved).replace(/[-_]/g, ' ');
  const slug = courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  console.log(`Course: "${courseName}" (slug: ${slug})`);

  // Ensure course_slug column exists
  await sql`ALTER TABLE chunks ADD COLUMN IF NOT EXISTS course_slug VARCHAR(100)`;

  // Upsert course
  const courseResult = await sql`
    INSERT INTO courses (name, slug)
    VALUES (${courseName}, ${slug})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  const courseId = courseResult.rows[0].id;
  console.log(`Course ID: ${courseId}`);

  // Recursively find all supported files
  function findFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findFiles(full));
      else if (SUPPORTED.has(entry.name.split('.').pop()?.toLowerCase() || '')) results.push(full);
    }
    return results;
  }

  const filePaths = findFiles(resolved).sort();

  if (filePaths.length === 0) {
    console.error('No PDF/PPTX/DOCX files found in folder.');
    process.exit(1);
  }

  console.log(`Found ${filePaths.length} files\n`);

  for (const filePath of filePaths) {
    const filename = path.relative(resolved, filePath);
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const priority = detectPriority(filename);

    console.log(`Processing: ${filename} (${ext}, priority: ${priority})`);

    // Delete existing document with same filename/course (re-upload)
    await sql`DELETE FROM documents WHERE course_id = ${courseId} AND filename = ${filename}`;

    const buffer = fs.readFileSync(filePath);
    const pages = await parseFile(buffer, ext);
    console.log(`  Parsed: ${pages.length} pages`);

    const chunks = chunkPages(pages);
    console.log(`  Chunked: ${chunks.length} chunks`);

    // Insert document
    const docResult = await sql`
      INSERT INTO documents (course_id, lecture_number, filename, file_type, total_pages, chunk_count, priority)
      VALUES (${courseId}, ${0}, ${filename}, ${ext}, ${pages.length}, ${chunks.length}, ${priority})
      RETURNING id
    `;
    const documentId = docResult.rows[0].id;

    // Embed
    const texts = chunks.map(c => c.content);
    console.log(`  Embedding ${texts.length} chunks...`);
    const embeddings = await embedBatch(texts);

    // Insert chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const values = batch.map((chunk, j) => {
        const idx = i + j;
        const embeddingStr = `[${embeddings[idx].join(',')}]`;
        return `($1, $${j * 3 + 2}, '${embeddingStr}'::vector, $${j * 3 + 3}, $${j * 3 + 4}, $${batch.length * 3 + 2})`;
      }).join(', ');

      const params: (string | number)[] = [documentId];
      for (const chunk of batch) {
        params.push(chunk.content, chunk.pageNumber, chunk.chunkIndex);
      }
      params.push(slug);

      await sql.query(
        `INSERT INTO chunks (document_id, content, embedding_vec, page_number, chunk_index, course_slug) VALUES ${values}`,
        params
      );
    }

    console.log(`  Done! Document ID: ${documentId}\n`);
  }

  console.log(`Course "${courseName}" uploaded successfully!\n`);
}

async function main() {
  const folderPath = process.argv[2];
  if (!folderPath) {
    console.error('Usage: npx tsx scripts/upload-folder.ts /path/to/CLA');
    process.exit(1);
  }

  const resolved = path.resolve(folderPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    console.error(`Not a directory: ${resolved}`);
    process.exit(1);
  }

  // Check if this folder contains sub-course folders
  const subdirs = fs.readdirSync(resolved, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name);

  const hasDirectFiles = fs.readdirSync(resolved)
    .some(f => SUPPORTED.has(f.split('.').pop()?.toLowerCase() || ''));

  if (subdirs.length > 0 && !hasDirectFiles) {
    // Parent folder with course subfolders (e.g. /CLA with CLA-Foundations-I, CLA-Strategy...)
    console.log(`Found ${subdirs.length} course folders\n`);
    for (const sub of subdirs.sort()) {
      await uploadCourse(path.join(resolved, sub));
    }
  } else {
    // Single course folder
    await uploadCourse(resolved);
  }

  console.log('All done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
