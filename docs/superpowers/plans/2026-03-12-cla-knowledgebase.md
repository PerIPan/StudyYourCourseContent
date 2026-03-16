# CLA Knowledgebase Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a RAG-powered study companion for the Cybersecurity Leadership Academy — chat with course content, get graded on exam questions, all deployed on Vercel.

**Architecture:** Next.js 14+ App Router with API routes for RAG pipeline. Vercel Postgres + pgvector stores document embeddings. OpenAI embeds questions, pgvector finds relevant chunks, Claude Sonnet 4 generates answers with source citations. Browser Web Speech API provides voice for all users.

**Tech Stack:** Next.js 14+, TypeScript, React, Vercel Postgres, pgvector, Anthropic SDK, OpenAI SDK (embeddings only), pdf-parse, mammoth, pptx-parser, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-12-cla-knowledgebase-design.md`

---

## File Structure

```
cla-knowledgebase/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                          # local env vars (gitignored)
├── .env.example                        # template for env vars
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root layout, fonts, metadata
│   │   ├── page.tsx                    # login page
│   │   ├── chat/
│   │   │   └── page.tsx               # chat interface
│   │   ├── exam/
│   │   │   └── page.tsx               # exam prep interface
│   │   ├── admin/
│   │   │   └── page.tsx               # admin upload panel
│   │   └── api/
│   │       ├── auth/
│   │       │   └── route.ts           # POST: password check → cookie
│   │       ├── chat/
│   │       │   └── route.ts           # POST: RAG chat pipeline
│   │       ├── exam/
│   │       │   ├── generate/
│   │       │   │   └── route.ts       # POST: generate exam question
│   │       │   └── grade/
│   │       │       └── route.ts       # POST: grade student answer
│   │       ├── upload/
│   │       │   └── route.ts           # POST: file upload + ingestion
│   │       └── documents/
│   │           └── route.ts           # GET: list docs, DELETE: remove doc
│   │
│   ├── lib/
│   │   ├── db.ts                      # Vercel Postgres connection + queries
│   │   ├── embeddings.ts              # OpenAI embedding helper
│   │   ├── chunker.ts                 # text chunking (500 tokens, 50 overlap)
│   │   ├── parsers.ts                 # PDF/PPTX/DOCX parsing
│   │   ├── priority.ts               # filename → priority detection
│   │   ├── rag.ts                     # search chunks + re-rank by priority
│   │   └── prompts.ts                # system prompts for chat/exam/grading
│   │
│   ├── components/
│   │   ├── LoginForm.tsx              # password form
│   │   ├── ChatMessages.tsx           # message list with citations
│   │   ├── ChatInput.tsx              # text input + mic + send
│   │   ├── VoiceButton.tsx            # hold-to-talk Web Speech API
│   │   ├── CourseBadges.tsx           # course filter badges
│   │   ├── SourceCitation.tsx         # citation block component
│   │   ├── ExamSetup.tsx              # course/lecture/type selectors
│   │   ├── ExamQuestion.tsx           # question display + answer area
│   │   ├── ExamGrading.tsx            # score + feedback display
│   │   ├── AdminUpload.tsx            # drag-and-drop upload
│   │   ├── AdminDocList.tsx           # document table with delete
│   │   └── NavTabs.tsx                # Chat / Exam Prep tab navigation
│   │
│   ├── hooks/
│   │   ├── useChat.ts                 # chat state + streaming
│   │   ├── useVoice.ts               # Web Speech API hook
│   │   └── useAuth.ts                # auth state + cookie check
│   │
│   └── types/
│       └── index.ts                   # shared TypeScript types
│
├── scripts/
│   └── seed-courses.ts                # seed 3 courses into DB
│
└── drizzle/
    ├── schema.ts                      # Drizzle ORM schema (courses, documents, chunks)
    └── migrations/                    # auto-generated migrations
```

---

## Chunk 1: Project Setup + Database + Core RAG Pipeline

### Task 1: Initialize Next.js Project

**Files:**
- Create: `cla-knowledgebase/package.json` (via create-next-app)
- Create: `cla-knowledgebase/.env.example`
- Create: `cla-knowledgebase/.env.local`

- [ ] **Step 1: Create Next.js app**

Run:
```bash
cd /Users/peripan/dev/CLAcontent
npx create-next-app@latest cla-knowledgebase --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
npm install @anthropic-ai/sdk openai @vercel/postgres drizzle-orm pdf-parse mammoth pptx-parser uuid dotenv
npm install -D drizzle-kit @types/pdf-parse @types/uuid
```

- [ ] **Step 3: Create .env.example**

Create `cla-knowledgebase/.env.example`:
```
# Database
POSTGRES_URL=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Auth
CLASS_PASSWORD=
ADMIN_PASSWORD=

# App
NEXT_PUBLIC_APP_NAME=CLA Knowledgebase
```

- [ ] **Step 4: Create .env.local with real values**

Create `cla-knowledgebase/.env.local`:
```
POSTGRES_URL=postgresql://localhost:5432/cla_knowledgebase
ANTHROPIC_API_KEY=<user provides>
OPENAI_API_KEY=<user provides>
CLASS_PASSWORD=cla2026
ADMIN_PASSWORD=<user provides>
NEXT_PUBLIC_APP_NAME=CLA Knowledgebase
```

- [ ] **Step 5: Initialize git and commit**

```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
git init
echo ".env.local" >> .gitignore
git add -A
git commit -m "chore: init Next.js project with dependencies"
```

---

### Task 2: Database Schema with Drizzle ORM

**Files:**
- Create: `src/lib/db.ts`
- Create: `drizzle/schema.ts`
- Create: `drizzle.config.ts`
- Create: `scripts/seed-courses.ts`

- [ ] **Step 1: Create Drizzle schema**

Create `cla-knowledgebase/drizzle/schema.ts`:
```typescript
import { pgTable, uuid, varchar, integer, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('courses_slug_idx').on(table.slug),
}));

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  lectureNumber: integer('lecture_number').notNull(),
  filename: varchar('filename', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 10 }).notNull(),
  totalPages: integer('total_pages').notNull().default(0),
  chunkCount: integer('chunk_count').notNull().default(0),
  priority: varchar('priority', { length: 10 }).notNull().default('normal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  courseIdx: index('documents_course_id_idx').on(table.courseId),
}));

export const chunks = pgTable('chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  // NOTE: embedding_vec vector(1536) column added via raw SQL in seed script
  // Drizzle doesn't support pgvector natively
  pageNumber: integer('page_number').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentIdx: index('chunks_document_id_idx').on(table.documentId),
}));
```

- [ ] **Step 2: Create DB connection helper**

Create `cla-knowledgebase/src/lib/db.ts`:
```typescript
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from '../../drizzle/schema';

export const db = drizzle(sql, { schema });

export async function initPgVector() {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
}

export async function createVectorColumn() {
  // Drizzle doesn't support pgvector natively, so we add it via raw SQL
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
```

- [ ] **Step 3: Create Drizzle config**

Create `cla-knowledgebase/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
```

- [ ] **Step 4: Create course seed script**

Create `cla-knowledgebase/scripts/seed-courses.ts`:
```typescript
import 'dotenv/config'; // loads .env.local
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
```

- [ ] **Step 5: Run migrations locally**

```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
# Create local database
/Applications/Postgres.app/Contents/Versions/18/bin/psql -c "CREATE DATABASE cla_knowledgebase;" postgres
# Run seed (dotenv/config in seed script loads .env.local automatically)
DOTENV_CONFIG_PATH=.env.local npx tsx scripts/seed-courses.ts
```

- [ ] **Step 6: Verify tables exist**

```bash
/Applications/Postgres.app/Contents/Versions/18/bin/psql cla_knowledgebase -c "\dt"
/Applications/Postgres.app/Contents/Versions/18/bin/psql cla_knowledgebase -c "SELECT * FROM courses;"
```
Expected: 3 rows (Foundations, Strategy, Threat Landscape)

- [ ] **Step 7: Commit**

```bash
git add drizzle/ src/lib/db.ts drizzle.config.ts scripts/
git commit -m "feat: database schema with pgvector + seed courses"
```

---

### Task 3: Shared Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create shared types**

Create `cla-knowledgebase/src/types/index.ts`:
```typescript
export interface Course {
  id: string;
  name: string;
  slug: string;
}

export interface Document {
  id: string;
  courseId: string;
  lectureNumber: number;
  filename: string;
  fileType: string;
  totalPages: number;
  chunkCount: number;
  priority: 'high' | 'normal';
  createdAt: string;
}

export interface ChunkResult {
  id: string;
  content: string;
  pageNumber: number;
  chunkIndex: number;
  filename: string;
  lectureNumber: number;
  priority: string;
  courseName: string;
  courseSlug: string;
  similarity: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
}

export interface SourceCitation {
  courseName: string;
  lectureNumber: number;
  filename: string;
  pageNumber: number;
}

export interface ExamQuestion {
  questionId: string; // server-side reference to rubric + source chunks
  question: string;
  questionType: 'open-ended' | 'scenario' | 'compare-contrast';
  courseName: string;
  lectureScope: number | null; // null = all lectures
}

export interface ExamGrade {
  score: number; // 1-10
  correct: string;
  missing: string;
  modelAnswer: string;
  sources: SourceCitation[];
}

export interface AdminDoc {
  id: string;
  filename: string;
  course_name: string;
  lecture_number: number;
  chunk_count: number;
  priority: string;
  file_type: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: shared TypeScript types"
```

---

### Task 4: Embeddings Helper

**Files:**
- Create: `src/lib/embeddings.ts`

- [ ] **Step 1: Create embeddings module**

Create `cla-knowledgebase/src/lib/embeddings.ts`:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // OpenAI supports batch embedding, max 2048 inputs
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    allEmbeddings.push(...response.data.map(d => d.embedding));
  }

  return allEmbeddings;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/embeddings.ts
git commit -m "feat: OpenAI embedding helper with batch support"
```

---

### Task 5: Text Chunker

**Files:**
- Create: `src/lib/chunker.ts`

- [ ] **Step 1: Create chunker module**

Create `cla-knowledgebase/src/lib/chunker.ts`:
```typescript
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
// Rough approximation: 1 token ≈ 4 characters
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

        // Keep overlap from end of buffer
        const overlapStart = Math.max(0, buffer.length - OVERLAP_CHARS);
        buffer = buffer.slice(overlapStart);
        currentPage = page.pageNumber;
      }
    }
  }

  // Flush remaining buffer
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
  // Split on sentence boundaries, keeping the delimiter
  return text
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/chunker.ts
git commit -m "feat: text chunker with 500-token target and 50-token overlap"
```

---

### Task 6: Document Parsers

**Files:**
- Create: `src/lib/parsers.ts`

- [ ] **Step 1: Create parsers module**

Create `cla-knowledgebase/src/lib/parsers.ts`:
```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

interface PageText {
  pageNumber: number;
  text: string;
}

export async function parsePdf(buffer: Buffer): Promise<PageText[]> {
  const data = await pdfParse(buffer);
  // pdf-parse returns all text; split by page markers if possible
  // For simplicity, treat as single page blocks based on form feeds
  const pages = data.text.split('\f');
  return pages.map((text, i) => ({
    pageNumber: i + 1,
    text: text.trim(),
  })).filter(p => p.text.length > 0);
}

export async function parseDocx(buffer: Buffer): Promise<PageText[]> {
  const result = await mammoth.extractRawText({ buffer });
  // DOCX doesn't have native page numbers, treat as single page
  return [{
    pageNumber: 1,
    text: result.value,
  }];
}

export async function parsePptx(buffer: Buffer): Promise<PageText[]> {
  // pptx-parser returns slides with text
  const PptxParser = (await import('pptx-parser')).default;
  const parser = new PptxParser();
  const slides = await parser.parse(buffer);

  return slides.map((slide: { text: string }, i: number) => ({
    pageNumber: i + 1,
    text: typeof slide === 'string' ? slide : (slide.text || ''),
  })).filter((p: PageText) => p.text.length > 0);
}

export async function parseFile(buffer: Buffer, fileType: string): Promise<PageText[]> {
  switch (fileType) {
    case 'pdf': return parsePdf(buffer);
    case 'docx': return parseDocx(buffer);
    case 'pptx': return parsePptx(buffer);
    default: throw new Error(`Unsupported file type: ${fileType}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/parsers.ts
git commit -m "feat: PDF/DOCX/PPTX parsers"
```

---

### Task 7: Priority Detection

**Files:**
- Create: `src/lib/priority.ts`

- [ ] **Step 1: Create priority module**

Create `cla-knowledgebase/src/lib/priority.ts`:
```typescript
const HIGH_PRIORITY_PATTERNS = [
  /must[- ]read/i,
  /important-/i,
  /slides/i,
  /exam/i,
  /summary/i,
  /use case/i,
];

const PPTX_EXTENSION = /\.pptx$/i;

export function detectPriority(filename: string): 'high' | 'normal' {
  if (PPTX_EXTENSION.test(filename)) return 'high';

  for (const pattern of HIGH_PRIORITY_PATTERNS) {
    if (pattern.test(filename)) return 'high';
  }

  return 'normal';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/priority.ts
git commit -m "feat: auto-detect content priority from filename"
```

---

### Task 8: RAG Search with Priority Re-ranking

**Files:**
- Create: `src/lib/rag.ts`

- [ ] **Step 1: Create RAG module**

Create `cla-knowledgebase/src/lib/rag.ts`:
```typescript
import { searchChunks } from './db';
import { embedText } from './embeddings';
import type { ChunkResult } from '@/types';

const PRIORITY_BOOST = 0.05; // boost high-priority chunks by 5%

export async function retrieveContext(
  question: string,
  courseSlug?: string,
  limit: number = 5
): Promise<ChunkResult[]> {
  const embedding = await embedText(question);
  const result = await searchChunks(embedding, courseSlug, 8); // fetch 8, re-rank to 5

  const rows = result.rows as ChunkResult[];

  // Re-rank: boost high-priority documents
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rag.ts
git commit -m "feat: RAG search with priority re-ranking"
```

---

### Task 9: System Prompts

**Files:**
- Create: `src/lib/prompts.ts`

- [ ] **Step 1: Create prompts module**

Create `cla-knowledgebase/src/lib/prompts.ts`:
```typescript
export const CHAT_SYSTEM_PROMPT = `You are a knowledgeable study assistant for the Cybersecurity Leadership Academy (CLA). You help students understand course material by answering questions based ONLY on the provided source material.

Rules:
- Answer ONLY based on the provided context. If the context doesn't contain enough information, say "I couldn't find relevant information in the course materials. Try rephrasing or selecting a specific course."
- NEVER make up information or use knowledge outside the provided sources.
- Always reference your sources using the format: (Source: [Course] / Lecture [N] / [filename], p.[page])
- Be thorough but concise. Use bullet points and structured formatting when appropriate.
- When explaining concepts, use examples from the course material when available.
- If multiple sources discuss a topic, synthesize them and cite all relevant sources.`;

export const EXAM_GENERATE_PROMPT = `You are an exam question generator for the Cybersecurity Leadership Academy. Based on the provided course material, generate a high-quality exam question.

Rules:
- Generate questions that test understanding, not just recall
- The question should be answerable using the provided source material
- Include enough context in the question for the student to understand what's expected

You must respond with valid JSON in this exact format:
{
  "question": "the exam question text",
  "rubric": "Internal grading rubric: list the key concepts that must be covered, the expected depth of analysis, and which specific source material supports each point. Score breakdown: [list points allocation]"
}`;

export const EXAM_GRADE_PROMPT = `You are an exam grader for the Cybersecurity Leadership Academy. Grade the student's answer against the rubric and source material.

Rules:
- Score from 1-10 based on the rubric
- Be fair but rigorous — partial credit for partially correct answers
- Clearly state what was correct and what was missed
- Provide a model answer that references the source material
- Be encouraging but honest

You must respond with valid JSON in this exact format:
{
  "score": <number 1-10>,
  "correct": "What the student got right",
  "missing": "What was missed or incorrect",
  "modelAnswer": "A thorough model answer with source references"
}`;

export function buildExamGenerateMessages(context: string, questionType: string) {
  const typeInstruction = {
    'open-ended': 'Generate an open-ended question that requires explanation and analysis.',
    'scenario': 'Generate a scenario-based question where the student must apply concepts to a realistic cybersecurity situation. Set the scene, then ask what they would do as a CISO or security leader.',
    'compare-contrast': 'Generate a compare-and-contrast question that requires the student to analyze similarities and differences between two or more concepts from the material.',
  }[questionType] || 'Generate an open-ended question.';

  return `${typeInstruction}\n\nSource material:\n${context}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prompts.ts
git commit -m "feat: system prompts for chat, exam generation, grading"
```

---

### Task 10: Auth API Route

**Files:**
- Create: `src/app/api/auth/route.ts`

- [ ] **Step 1: Create auth route**

Create `cla-knowledgebase/src/app/api/auth/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  // Server determines role — try admin first, fall back to student
  let role: 'admin' | 'student';
  if (password === process.env.ADMIN_PASSWORD) {
    role = 'admin';
  } else if (password === process.env.CLASS_PASSWORD) {
    role = 'student';
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('cla-auth', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return NextResponse.json({ role });
}

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');

  if (!auth || !['student', 'admin'].includes(auth.value)) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  return NextResponse.json({ role: auth.value });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: auth API route with server-side role detection and session check"
```

---

### Task 11: Chat API Route (Core RAG)

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create chat route**

Create `cla-knowledgebase/src/app/api/chat/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { retrieveContext, formatContextForPrompt, extractCitations } from '@/lib/rag';
import { CHAT_SYSTEM_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { message, courseSlug } = await request.json();

  if (!message || typeof message !== 'string') {
    return new Response('Message required', { status: 400 });
  }

  // Retrieve relevant chunks
  const chunks = await retrieveContext(message, courseSlug || undefined);

  if (chunks.length === 0) {
    return Response.json({
      content: "I couldn't find relevant information in the course materials. Try rephrasing or selecting a specific course.",
      sources: [],
    });
  }

  const context = formatContextForPrompt(chunks);
  const citations = extractCitations(chunks);

  // Stream response from Claude
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CHAT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Context from course materials:\n\n${context}\n\n---\n\nStudent question: ${message}`,
      },
    ],
  });

  // Return streaming response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Send citations first as a special event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'citations', data: citations })}\n\n`)
      );

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', data: event.delta.text })}\n\n`)
          );
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/
git commit -m "feat: streaming RAG chat API with Claude + source citations"
```

---

### Task 12: Upload API Route

**Files:**
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Create upload route**

Create `cla-knowledgebase/src/app/api/upload/route.ts`:
```typescript
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

  // Create document record
  const docResult = await sql`
    INSERT INTO documents (course_id, lecture_number, filename, file_type, total_pages, chunk_count, priority)
    VALUES (${courseId}, ${lectureNumber}, ${filename}, ${fileType}, ${pages.length}, ${chunks.length}, ${priority})
    RETURNING id
  `;
  const documentId = docResult.rows[0].id;

  // Embed all chunks in batches
  const texts = chunks.map(c => c.content);
  const embeddings = await embedBatch(texts);

  // Insert chunks with embeddings in batches of 20 (avoid individual round-trips)
  const BATCH_SIZE = 20;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const values = batch.map((chunk, j) => {
      const idx = i + j;
      const embeddingStr = `[${embeddings[idx].join(',')}]`;
      return `('${documentId}', $${idx * 4 + 1}, '${embeddingStr}'::vector, ${chunk.pageNumber}, ${chunk.chunkIndex})`;
    });

    // Use transaction for batch insert
    await sql.query(`
      INSERT INTO chunks (document_id, content, embedding_vec, page_number, chunk_index)
      VALUES ${batch.map((chunk, j) => {
        const embeddingStr = `[${embeddings[i + j].join(',')}]`;
        return `($1, $${j * 3 + 2}, '${embeddingStr}'::vector, $${j * 3 + 3}, $${j * 3 + 4})`;
      }).join(', ')}
    `, [documentId, ...batch.flatMap(chunk => [chunk.content, chunk.pageNumber, chunk.chunkIndex])]);
  }

  return NextResponse.json({
    documentId,
    filename,
    chunkCount: chunks.length,
    priority,
    totalPages: pages.length,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload/
git commit -m "feat: file upload API with parsing, chunking, embedding"
```

---

### Task 13: Documents API Route

**Files:**
- Create: `src/app/api/documents/route.ts`

- [ ] **Step 1: Create documents route**

Create `cla-knowledgebase/src/app/api/documents/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (auth?.value !== 'admin') {
    return new Response('Admin access required', { status: 403 });
  }

  const result = await sql`
    SELECT d.*, c.name as course_name, c.slug as course_slug
    FROM documents d
    JOIN courses c ON d.course_id = c.id
    ORDER BY c.name, d.lecture_number, d.filename
  `;

  return NextResponse.json(result.rows);
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (auth?.value !== 'admin') {
    return new Response('Admin access required', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  // CASCADE delete removes chunks automatically
  await sql`DELETE FROM documents WHERE id = ${id}`;

  return NextResponse.json({ deleted: id });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/documents/
git commit -m "feat: documents list and delete API (admin)"
```

---

### Task 13b: Courses API Route

**Files:**
- Create: `src/app/api/courses/route.ts`

- [ ] **Step 1: Create courses route**

Create `cla-knowledgebase/src/app/api/courses/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { courses } from '@/../drizzle/schema';

export async function GET() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) return NextResponse.json([], { status: 401 });

  const allCourses = await db.select().from(courses);
  return NextResponse.json(allCourses);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/courses/
git commit -m "feat: courses list API endpoint"
```

---

### Task 14: Exam API Routes

**Files:**
- Create: `src/app/api/exam/generate/route.ts`
- Create: `src/app/api/exam/grade/route.ts`

- [ ] **Step 1: Create exam generate route**

Create `cla-knowledgebase/src/app/api/exam/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';
import { embedText } from '@/lib/embeddings';
import { EXAM_GENERATE_PROMPT, buildExamGenerateMessages } from '@/lib/prompts';
import { formatContextForPrompt } from '@/lib/rag';
import type { ChunkResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Server-side store for rubrics + source chunks (prevents leaking to client)
// In serverless, this resets per cold start — acceptable for exam prep use case
export const examStore = new Map<string, { rubric: string; sourceChunks: any[]; expiresAt: number }>();

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { courseSlug, lectureNumber, questionType } = await request.json();

  // Get random chunks from the selected scope
  let result;
  if (courseSlug && lectureNumber) {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name, co.slug as course_slug
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE co.slug = ${courseSlug} AND d.lecture_number = ${lectureNumber}
      ORDER BY RANDOM()
      LIMIT 5
    `;
  } else if (courseSlug) {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name, co.slug as course_slug
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      WHERE co.slug = ${courseSlug}
      ORDER BY RANDOM()
      LIMIT 5
    `;
  } else {
    result = await sql`
      SELECT c.content, c.page_number, c.chunk_index,
             d.filename, d.lecture_number, d.priority,
             co.name as course_name, co.slug as course_slug
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      JOIN courses co ON d.course_id = co.id
      ORDER BY RANDOM()
      LIMIT 5
    `;
  }

  const chunks = result.rows as ChunkResult[];

  if (chunks.length === 0) {
    return NextResponse.json({ error: 'No content available for this scope' }, { status: 404 });
  }

  const context = formatContextForPrompt(chunks);
  const userMessage = buildExamGenerateMessages(context, questionType);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: EXAM_GENERATE_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const parsed = JSON.parse(text);

    // Store rubric + source chunks server-side to prevent leaking to client
    // Use a simple in-memory map keyed by question hash (good enough for this scale)
    const questionId = crypto.randomUUID();
    examStore.set(questionId, {
      rubric: parsed.rubric,
      sourceChunks: chunks,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 min TTL
    });

    return NextResponse.json({
      questionId,
      question: parsed.question,
      questionType,
      courseName: chunks[0].course_name,
      lectureScope: lectureNumber || null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create exam grade route**

Create `cla-knowledgebase/src/app/api/exam/grade/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import { EXAM_GRADE_PROMPT } from '@/lib/prompts';
import { formatContextForPrompt, extractCitations } from '@/lib/rag';
import { examStore } from '../generate/route';
import type { ChunkResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('cla-auth');
  if (!auth) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { questionId, question, studentAnswer } = await request.json();

  if (!questionId || !question || !studentAnswer) {
    return NextResponse.json({ error: 'questionId, question, studentAnswer required' }, { status: 400 });
  }

  // Retrieve rubric + chunks from server-side store
  const stored = examStore.get(questionId);
  if (!stored || stored.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'Question expired. Generate a new one.' }, { status: 410 });
  }

  const { rubric, sourceChunks } = stored;
  examStore.delete(questionId); // one-time use

  const context = formatContextForPrompt(sourceChunks as ChunkResult[]);
  const citations = extractCitations(sourceChunks as ChunkResult[]);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: EXAM_GRADE_PROMPT,
    messages: [{
      role: 'user',
      content: `Question: ${question}\n\nRubric: ${rubric}\n\nSource material:\n${context}\n\nStudent answer:\n${studentAnswer}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({
      score: parsed.score,
      correct: parsed.correct,
      missing: parsed.missing,
      modelAnswer: parsed.modelAnswer,
      sources: citations,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to grade answer' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/exam/
git commit -m "feat: exam generate and grade API routes"
```

---

## Chunk 2: Frontend — Login, Chat, Exam Prep, Admin

### Task 15: Auth Hook + Types

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create auth hook**

Create `cla-knowledgebase/src/hooks/useAuth.ts`:
```typescript
'use client';

import { useState, useEffect } from 'react';

type Role = 'student' | 'admin' | null;

export function useAuth() {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dedicated auth check endpoint
    fetch('/api/auth')
      .then(res => res.ok ? res.json() : { role: null })
      .then(data => setRole(data.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(password: string) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) throw new Error('Invalid password');

    const data = await res.json();
    setRole(data.role);
    return data.role as Role;
  }

  return { role, loading, login };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: auth hook with cookie-based session check"
```

---

### Task 16: Chat Hook (Streaming)

**Files:**
- Create: `src/hooks/useChat.ts`

- [ ] **Step 1: Create chat hook**

Create `cla-knowledgebase/src/hooks/useChat.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, SourceCitation } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, courseSlug: courseFilter }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      // Check if streaming response
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let sources: SourceCitation[] = [];

        // Add placeholder assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'citations') {
                sources = parsed.data;
              } else if (parsed.type === 'text') {
                assistantContent += parsed.data;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                    sources,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      } else {
        // Non-streaming fallback (e.g., zero results)
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
          sources: data.sources || [],
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [courseFilter]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages, courseFilter, setCourseFilter };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useChat.ts
git commit -m "feat: chat hook with SSE streaming support"
```

---

### Task 17: Voice Hook

**Files:**
- Create: `src/hooks/useVoice.ts`

- [ ] **Step 1: Create voice hook**

Create `cla-knowledgebase/src/hooks/useVoice.ts`:
```typescript
'use client';

import { useState, useRef, useCallback } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [autoReadAloud, setAutoReadAloud] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, []);

  const stopListening = useCallback((): string => {
    recognitionRef.current?.stop();
    setIsListening(false);
    return transcript;
  }, [transcript]);

  const speak = useCallback((text: string) => {
    if (!autoReadAloud) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [autoReadAloud]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    autoReadAloud,
    setAutoReadAloud,
    isSupported,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useVoice.ts
git commit -m "feat: Web Speech API hook for hold-to-talk and read-aloud"
```

---

### Task 18: UI Components — Login

**Files:**
- Create: `src/components/LoginForm.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create LoginForm component**

Create `cla-knowledgebase/src/components/LoginForm.tsx`:
```typescript
'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (password: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(password);
    } catch {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center w-80">
        <div className="text-5xl mb-3">🛡️</div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">CLA Knowledgebase</h1>
        <p className="text-sm text-slate-500 mb-8">Cybersecurity Leadership Academy</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter class password"
            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-4 py-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update root layout**

Overwrite `cla-knowledgebase/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CLA Knowledgebase',
  description: 'Cybersecurity Leadership Academy — Study Companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Update login page**

Overwrite `cla-knowledgebase/src/app/page.tsx`:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/LoginForm';
import { useEffect } from 'react';

export default function Home() {
  const { role, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role) router.push('/chat');
  }, [role, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  async function handleLogin(password: string) {
    await login(password);
    router.push('/chat');
  }

  return <LoginForm onLogin={handleLogin} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LoginForm.tsx src/app/page.tsx src/app/layout.tsx
git commit -m "feat: login page with password form"
```

---

### Task 19: UI Components — Chat Interface

**Files:**
- Create: `src/components/NavTabs.tsx`
- Create: `src/components/CourseBadges.tsx`
- Create: `src/components/SourceCitation.tsx`
- Create: `src/components/ChatMessages.tsx`
- Create: `src/components/VoiceButton.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/app/chat/page.tsx`

- [ ] **Step 1: Create NavTabs**

Create `cla-knowledgebase/src/components/NavTabs.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/chat', label: 'Chat' },
    { href: '/exam', label: 'Exam Prep' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="flex gap-0">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            pathname === tab.href
              ? 'text-indigo-500 font-semibold border-indigo-500'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create CourseBadges**

Create `cla-knowledgebase/src/components/CourseBadges.tsx`:
```typescript
'use client';

const COURSES = [
  { slug: null, label: 'All', bg: 'bg-slate-100', text: 'text-slate-600', activeBg: 'bg-slate-200' },
  { slug: 'foundations', label: 'Foundations', bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'bg-indigo-100' },
  { slug: 'strategy', label: 'Strategy', bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-100' },
  { slug: 'threat-landscape', label: 'Threats', bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-100' },
];

interface CourseBadgesProps {
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CourseBadges({ selected, onSelect }: CourseBadgesProps) {
  return (
    <div className="flex gap-1.5">
      {COURSES.map(c => (
        <button
          key={c.slug ?? 'all'}
          onClick={() => onSelect(c.slug)}
          className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
            selected === c.slug
              ? `${c.activeBg} ${c.text} ring-2 ring-current ring-opacity-30`
              : `${c.bg} ${c.text}`
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create SourceCitation**

Create `cla-knowledgebase/src/components/SourceCitation.tsx`:
```typescript
import type { SourceCitation as Citation } from '@/types';

export function SourceCitationBlock({ sources }: { sources: Citation[] }) {
  if (!sources?.length) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-3 mt-3 text-xs">
      <div className="text-slate-400 mb-1">📄 Sources:</div>
      {sources.map((s, i) => (
        <div key={i} className="text-indigo-500">
          • {s.courseName} / Lecture {s.lectureNumber} / {s.filename}, p.{s.pageNumber}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create ChatMessages**

Create `cla-knowledgebase/src/components/ChatMessages.tsx`:
```typescript
'use client';

import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';
import { SourceCitationBlock } from './SourceCitation';

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Ask a question about your CLA course materials
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
            msg.role === 'user'
              ? 'bg-indigo-500 text-white rounded-br-none'
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
          }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.role === 'assistant' && msg.sources && (
              <SourceCitationBlock sources={msg.sources} />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 5: Create VoiceButton**

Create `cla-knowledgebase/src/components/VoiceButton.tsx`:
```typescript
'use client';

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

export function VoiceButton({ isListening, isSupported, onMouseDown, onMouseUp }: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
        isListening
          ? 'bg-red-100 text-red-500 ring-2 ring-red-300 animate-pulse'
          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
      }`}
      title="Hold to talk"
    >
      🎤
    </button>
  );
}
```

- [ ] **Step 6: Create ChatInput**

Create `cla-knowledgebase/src/components/ChatInput.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { VoiceButton } from './VoiceButton';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  voice: {
    isListening: boolean;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => string;
  };
}

export function ChatInput({ onSend, isLoading, voice }: ChatInputProps) {
  const [input, setInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  }

  function handleVoiceUp() {
    const text = voice.stopListening();
    if (text.trim()) {
      onSend(text.trim());
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <VoiceButton
          isListening={voice.isListening}
          isSupported={voice.isSupported}
          onMouseDown={voice.startListening}
          onMouseUp={handleVoiceUp}
        />
        <input
          value={voice.isListening ? '🔴 Listening...' : input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your CLA course material..."
          disabled={isLoading || voice.isListening}
          className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          ↑
        </button>
      </form>
      <p className="text-center text-slate-400 text-[0.65rem] mt-1.5">
        Hold 🎤 to speak · answers read aloud automatically
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Create chat page**

Create `cla-knowledgebase/src/app/chat/page.tsx`:
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { NavTabs } from '@/components/NavTabs';
import { CourseBadges } from '@/components/CourseBadges';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';

export default function ChatPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const { messages, isLoading, sendMessage, courseFilter, setCourseFilter } = useChat();
  const voice = useVoice();

  useEffect(() => {
    if (!loading && !role) router.push('/');
  }, [loading, role, router]);

  // Read aloud new assistant messages when streaming completes
  const prevMessagesLen = useRef(0);
  useEffect(() => {
    if (!isLoading && messages.length > prevMessagesLen.current) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.content) {
        voice.speak(last.content);
      }
    }
    prevMessagesLen.current = messages.length;
  }, [isLoading, messages.length, voice]);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <span className="font-semibold text-slate-800 text-sm">CLA Knowledgebase</span>
          <NavTabs />
        </div>
        <CourseBadges selected={courseFilter} onSelect={setCourseFilter} />
      </header>

      {/* Messages */}
      <ChatMessages messages={messages} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        voice={voice}
      />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/app/chat/
git commit -m "feat: chat UI with streaming messages, voice, course filter"
```

---

### Task 20: UI Components — Exam Prep

**Files:**
- Create: `src/components/ExamSetup.tsx`
- Create: `src/components/ExamQuestion.tsx`
- Create: `src/components/ExamGrading.tsx`
- Create: `src/app/exam/page.tsx`

- [ ] **Step 1: Create ExamSetup**

Create `cla-knowledgebase/src/components/ExamSetup.tsx`:
```typescript
'use client';

interface ExamSetupProps {
  courseSlug: string | null;
  setCourseSlug: (slug: string | null) => void;
  lectureNumber: number | null;
  setLectureNumber: (n: number | null) => void;
  questionType: string;
  setQuestionType: (t: string) => void;
  onGenerate: () => void;
  loading: boolean;
  sessionScore: { total: number; count: number };
}

const COURSES = [
  { slug: null, label: 'All Courses' },
  { slug: 'foundations', label: 'Foundations' },
  { slug: 'strategy', label: 'Strategy' },
  { slug: 'threat-landscape', label: 'Threats' },
];

const QUESTION_TYPES = [
  { value: 'open-ended', label: 'Open-ended' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'compare-contrast', label: 'Compare & Contrast' },
];

export function ExamSetup({
  courseSlug, setCourseSlug, lectureNumber, setLectureNumber,
  questionType, setQuestionType, onGenerate, loading, sessionScore,
}: ExamSetupProps) {
  return (
    <div className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-5">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Course</div>
        <div className="flex gap-2 flex-wrap">
          {COURSES.map(c => (
            <button
              key={c.slug ?? 'all'}
              onClick={() => { setCourseSlug(c.slug); setLectureNumber(null); }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                courseSlug === c.slug
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {courseSlug && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Lecture</div>
          <div className="flex gap-2">
            <button
              onClick={() => setLectureNumber(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                lectureNumber === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              All
            </button>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setLectureNumber(n)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                  lectureNumber === n
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Question Type</div>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setQuestionType(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-colors ${
                questionType === t.value
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Question'}
      </button>

      {sessionScore.count > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
          <span className="text-sm text-slate-500">Session Score</span>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-slate-500">{sessionScore.count} questions</span>
            <span className="text-lg font-bold text-emerald-600">
              {(sessionScore.total / sessionScore.count).toFixed(1)} / 10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ExamQuestion**

Create `cla-knowledgebase/src/components/ExamQuestion.tsx`:
```typescript
'use client';

import { useState } from 'react';

interface ExamQuestionProps {
  question: string;
  questionType: string;
  courseName: string;
  lectureScope: number | null;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

export function ExamQuestion({ question, questionType, courseName, lectureScope, onSubmit, loading }: ExamQuestionProps) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-semibold">{courseName}</span>
        {lectureScope && <span className="text-xs text-slate-500">Lecture {lectureScope}</span>}
        <span className="text-xs text-slate-400">· {questionType}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Question</div>
        <p className="text-sm text-slate-800 leading-relaxed">{question}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Your Answer</div>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={8}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        onClick={() => onSubmit(answer)}
        disabled={loading || !answer.trim()}
        className="w-full bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Grading...' : 'Submit Answer'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create ExamGrading**

Create `cla-knowledgebase/src/components/ExamGrading.tsx`:
```typescript
'use client';

import { SourceCitationBlock } from './SourceCitation';
import type { ExamGrade } from '@/types';

interface ExamGradingProps {
  grade: ExamGrade;
  question: string;
  onNext: () => void;
  onBack: () => void;
}

export function ExamGrading({ grade, question, onNext, onBack }: ExamGradingProps) {

  const scoreColor = grade.score >= 7 ? 'text-emerald-600 bg-emerald-50' :
    grade.score >= 4 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-indigo-500 uppercase mb-2">Question</div>
        <p className="text-sm text-slate-600">{question}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Grading</div>
          <div className={`text-lg font-bold px-3 py-1 rounded-lg ${scoreColor}`}>
            {grade.score} / 10
          </div>
        </div>

        <div className="text-sm text-slate-700 leading-relaxed mb-3">
          <strong className="text-emerald-600">Correct:</strong> {grade.correct}
        </div>
        <div className="text-sm text-slate-700 leading-relaxed">
          <strong className="text-amber-600">Missing:</strong> {grade.missing}
        </div>

        <details className="mt-4">
          <summary className="text-sm text-indigo-500 cursor-pointer font-semibold">View model answer</summary>
          <div className="mt-2 text-sm text-slate-600 leading-relaxed p-3 bg-slate-50 rounded-lg">
            {grade.modelAnswer}
          </div>
        </details>

        <SourceCitationBlock sources={grade.sources} />
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg py-3 text-sm">
          Back to Setup
        </button>
        <button onClick={onNext} className="flex-1 bg-indigo-500 text-white rounded-lg py-3 font-semibold text-sm hover:bg-indigo-600 transition-colors">
          Next Question →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create exam page**

Create `cla-knowledgebase/src/app/exam/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavTabs } from '@/components/NavTabs';
import { ExamSetup } from '@/components/ExamSetup';
import { ExamQuestion } from '@/components/ExamQuestion';
import { ExamGrading } from '@/components/ExamGrading';
import type { ExamQuestion as ExamQ, ExamGrade } from '@/types';

type ExamState = 'setup' | 'question' | 'grading';

export default function ExamPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<ExamState>('setup');
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [lectureNumber, setLectureNumber] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState('open-ended');
  const [currentQuestion, setCurrentQuestion] = useState<ExamQ | null>(null);
  const [currentGrade, setCurrentGrade] = useState<ExamGrade | null>(null);
  const [generating, setGenerating] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sessionScore, setSessionScore] = useState({ total: 0, count: 0 });

  useEffect(() => {
    if (!loading && !role) router.push('/');
  }, [loading, role, router]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, lectureNumber, questionType }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setCurrentQuestion(data);
      setState('question');
    } catch (error) {
      alert('Failed to generate question. Make sure content is uploaded.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitAnswer(answer: string) {
    if (!currentQuestion) return;
    setGrading(true);
    try {
      const res = await fetch('/api/exam/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          question: currentQuestion.question,
          studentAnswer: answer,
        }),
      });
      if (!res.ok) throw new Error('Failed to grade');
      const grade = await res.json();
      setCurrentGrade(grade);
      setSessionScore(prev => ({ total: prev.total + grade.score, count: prev.count + 1 }));
      setState('grading');
    } catch {
      alert('Failed to grade answer.');
    } finally {
      setGrading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <span className="text-xl">🛡️</span>
        <span className="font-semibold text-slate-800 text-sm">CLA Knowledgebase</span>
        <NavTabs />
      </header>

      {state === 'setup' && (
        <ExamSetup
          courseSlug={courseSlug} setCourseSlug={setCourseSlug}
          lectureNumber={lectureNumber} setLectureNumber={setLectureNumber}
          questionType={questionType} setQuestionType={setQuestionType}
          onGenerate={handleGenerate} loading={generating}
          sessionScore={sessionScore}
        />
      )}

      {state === 'question' && currentQuestion && (
        <ExamQuestion
          question={currentQuestion.question}
          questionType={currentQuestion.questionType}
          courseName={currentQuestion.courseName}
          lectureScope={currentQuestion.lectureScope}
          onSubmit={handleSubmitAnswer}
          loading={grading}
        />
      )}

      {state === 'grading' && currentGrade && currentQuestion && (
        <ExamGrading
          grade={currentGrade}
          question={currentQuestion.question}
          onNext={handleGenerate}
          onBack={() => setState('setup')}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Exam* src/app/exam/
git commit -m "feat: exam prep UI with question generation, answer submission, grading"
```

---

### Task 21: Admin Upload Panel

**Files:**
- Create: `src/components/AdminUpload.tsx`
- Create: `src/components/AdminDocList.tsx`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create AdminUpload**

Create `cla-knowledgebase/src/components/AdminUpload.tsx`:
```typescript
'use client';

import { useState, useRef } from 'react';

interface AdminUploadProps {
  courses: { id: string; name: string; slug: string }[];
  onUploaded: () => void;
}

export function AdminUpload({ courses, onUploaded }: AdminUploadProps) {
  const [courseId, setCourseId] = useState('');
  const [lectureNumber, setLectureNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!courseId) { setStatus('Select a course first'); return; }
    setUploading(true);
    setStatus(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('lectureNumber', String(lectureNumber));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setStatus(`✓ ${file.name}: ${data.chunkCount} chunks (${data.priority} priority)`);
      onUploaded();
    } catch {
      setStatus(`✗ Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-slate-800 text-sm mb-3">Upload Document</h3>

      <div className="flex gap-3 mb-3">
        <select
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={lectureNumber}
          onChange={e => setLectureNumber(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm w-28"
        >
          {[1, 2, 3, 4, 5, 6].map(n => (
            <option key={n} value={n}>Lecture {n}</option>
          ))}
        </select>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
      >
        <p className="text-slate-400 text-sm">Drop PDF, PPTX, or DOCX here</p>
        <p className="text-slate-300 text-xs mt-1">or click to browse</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.pptx,.docx"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        className="hidden"
      />

      {status && (
        <p className={`mt-3 text-sm ${status.startsWith('✓') ? 'text-emerald-600' : status.startsWith('✗') ? 'text-red-500' : 'text-slate-500'}`}>
          {uploading ? '⏳ ' : ''}{status}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create AdminDocList**

Create `cla-knowledgebase/src/components/AdminDocList.tsx`:
```typescript
'use client';

import type { AdminDoc } from '@/types';

interface AdminDocListProps {
  documents: AdminDoc[];
  onDelete: (id: string) => void;
}

export function AdminDocList({ documents, onDelete }: AdminDocListProps) {
  if (documents.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-8">No documents uploaded yet</p>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2">Course</th>
            <th className="text-left px-4 py-2">Lec</th>
            <th className="text-left px-4 py-2">File</th>
            <th className="text-left px-4 py-2">Chunks</th>
            <th className="text-left px-4 py-2">Priority</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className="border-t border-slate-100">
              <td className="px-4 py-2 text-slate-700">{doc.course_name}</td>
              <td className="px-4 py-2 text-slate-500">{doc.lecture_number}</td>
              <td className="px-4 py-2 text-slate-700 truncate max-w-[200px]">{doc.filename}</td>
              <td className="px-4 py-2 text-slate-500">{doc.chunk_count}</td>
              <td className="px-4 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  doc.priority === 'high' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {doc.priority}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Create admin page**

Create `cla-knowledgebase/src/app/admin/page.tsx`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminUpload } from '@/components/AdminUpload';
import { AdminDocList } from '@/components/AdminDocList';
import type { AdminDoc, Course } from '@/types';

export default function AdminPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<AdminDoc[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const fetchDocs = useCallback(async () => {
    const res = await fetch('/api/documents');
    if (res.ok) setDocuments(await res.json());
  }, []);

  useEffect(() => {
    if (!loading && role !== 'admin') router.push('/');
  }, [loading, role, router]);

  useEffect(() => {
    if (role === 'admin') {
      fetchDocs();
      fetch('/api/courses')
        .then(res => res.ok ? res.json() : [])
        .then(data => setCourses(data));
    }
  }, [role, fetchDocs]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this document and all its chunks?')) return;
    await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    fetchDocs();
  }

  if (loading || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🛡️</span>
          <h1 className="text-lg font-bold text-slate-800">Admin — Document Management</h1>
          <a href="/chat" className="ml-auto text-sm text-indigo-500 hover:underline">← Back to chat</a>
        </div>

        <AdminUpload courses={courses} onUploaded={fetchDocs} />
        <AdminDocList documents={documents} onDelete={handleDelete} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Admin* src/app/admin/
git commit -m "feat: admin panel with drag-drop upload and document management"
```

---

## Chunk 3: Deployment + Final Polish

### Task 22: Vercel Deployment Setup

**Files:**
- Modify: `next.config.ts`
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Update next.config.ts for Vercel**

Overwrite `cla-knowledgebase/next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // allow large file uploads
    },
  },
};

export default nextConfig;
```

- [ ] **Step 2: Create public GitHub repo and push**

```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
gh repo create PerIPan/StudyYourCourseContent --public --source=. --push --description "RAG-powered study companion — chat with your course content, get AI-graded exam practice"
```

Note: repo is public/open-source. No course content data is committed — only the app code. Content is uploaded via the admin panel at runtime.

- [ ] **Step 3: Create Vercel Postgres database**

In Vercel dashboard → Storage → Create Postgres Database → connect to project.
This must be done BEFORE deploying so the app has a database on first boot.

- [ ] **Step 4: Set environment variables in Vercel**

In Vercel dashboard → Project Settings → Environment Variables:
- `POSTGRES_URL` — auto-populated from Vercel Postgres addon
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `CLASS_PASSWORD`
- `ADMIN_PASSWORD`

- [ ] **Step 5: Run migrations on production database**

```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
npx vercel env pull .env.local
# Verify .env.local is in .gitignore (it should be from Task 1)
grep -q '.env.local' .gitignore || echo '.env.local' >> .gitignore
# Run seed script which creates tables + seeds courses
npx tsx scripts/seed-courses.ts
```

Verify tables created:
```bash
/Applications/Postgres.app/Contents/Versions/18/bin/psql "$POSTGRES_URL" -c "SELECT * FROM courses;"
```
Expected: 3 rows (Foundations, Strategy, Threat Landscape)

- [ ] **Step 6: Deploy to Vercel**

```bash
cd /Users/peripan/dev/CLAcontent/cla-knowledgebase
npx vercel link
npx vercel deploy --prod
```

- [ ] **Step 7: Test deployment**

Visit the Vercel URL:
1. Login with class password → chat page loads
2. Send a test question → should get "no content" response (no docs uploaded yet)
3. Login with admin password → upload panel accessible
4. Test hold-to-talk voice button (Chrome/Safari) — verify mic activates and speech is recognized
5. Verify admin panel is NOT accessible with class password (only admin password)

- [ ] **Step 8: Commit any deploy fixes**

```bash
git add next.config.ts vercel.json .gitignore
git commit -m "chore: Vercel deployment config"
```

---

### Task 23: Upload Course Content

- [ ] **Step 1: Login as admin on deployed app**

- [ ] **Step 2: Upload all files by course**

Upload order (high priority first):

**Foundations 1** — 22 files (flat folder, assign lecture by filename):
| Filename pattern | Lecture |
|-----------------|---------|
| `Foundations I - 1.pptx` | 1 |
| `Foundations I - 2.pptx` | 2 |
| `Foundations I - 3.pdf` | 3 |
| `Foundations I - 4.pptx` | 4 |
| `Foundations I - 5.pptx` | 5 |
| `Foundations I - 6.pptx` | 6 |
| `Use Case lecture 2.docx` | 2 |
| `use case lecture 3 answers.docx` | 3 |
| `use case lecture 4.docx` | 4 |
| `use case lecture 5.docx` | 5 |
| `summary - reader cybersecurity foundations 1.pdf` | 1 |
| All other reading materials (WEF, NIST, etc.) | 1 (general course reading) |

**Strategy & Leadership** — 11 files, lectures 1-6 (folder names match)

**Threat Landscape** — 27 files, lectures 1-6 + exam questions (lecture 1 for exam PDF)

- [ ] **Step 3: Verify in admin panel**

Check that all documents appear with correct course, lecture, chunk count, and priority.

- [ ] **Step 4: Test chat with real content**

Ask questions like:
- "What are the NIST CSF core functions?"
- "Compare state-sponsored and cybercriminal threat actors"
- "What does the CISO role look like today vs tomorrow?"

Verify source citations are accurate.

- [ ] **Step 5: Test exam prep**

Generate questions from each course. Submit answers. Verify grading makes sense.

---

### Task 24: Share with Class

- [ ] **Step 1: Test auth security**

- Visit Vercel URL without logging in → should redirect to login
- Login with class password → verify admin panel (/admin) returns to login
- Verify session cookie expires after 7 days

- [ ] **Step 2: Test on mobile browser**

Verify responsive layout works on phone. Test voice button on mobile Chrome.

- [ ] **Step 3: Share the Vercel URL + class password with classmates**

- [ ] **Step 4: Final commit and push**

```bash
git add next.config.ts
git commit -m "chore: production ready"
git push origin main
```
