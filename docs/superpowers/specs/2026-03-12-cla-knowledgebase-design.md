# CLA Knowledgebase — Design Spec

## Overview

RAG-powered study companion for the Cybersecurity Leadership Academy (CLA). Students chat with course content via a web app, getting AI answers with source citations. Deployed on Vercel, shared via URL with password protection.

## Goals

- Chat-based Q&A over CLA lecture materials (PDFs, PPTX, DOCX)
- Source citations in every answer (course / lecture / page)
- Exam prep mode — AI-generated questions from course content, student answers graded with feedback
- Shared access for classmates via URL + password
- Browser-based hold-to-talk voice for all users
- Content priority weighting — "must-read", exam questions, slides ranked higher than supplementary reading
- Admin-only document upload and management
- Extensible — more courses/lectures added over time

## Non-Goals

- Individual user accounts or per-user history
- Classmate document uploads
- Real-time collaboration

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), React, TypeScript |
| Backend | Next.js API Routes (serverless) |
| Database | Vercel Postgres + pgvector extension |
| Embeddings | OpenAI text-embedding-3-small (1536 dimensions) |
| LLM | Claude Sonnet 4 via Anthropic SDK |
| Voice (browser) | Web Speech API (STT) + SpeechSynthesis (TTS) |
| Voice (local) | ~~OpenWhisperer~~ — removed, browser voice for all users |
| Hosting | Vercel |
| Repository | github.com/PerIPan/StudyYourCourseContent (public, open-source) |
| Document parsing | pdf-parse (PDF), mammoth (DOCX), pptx-parser (PPTX) |

### System Components

```
Users
├── Web Chat UI (all users) ──────────┐
│   └── Browser Voice (hold-to-talk)  │
└── Admin Upload Panel (admin only) ──┤
                                      │
                              Next.js API Routes
                              ├── POST /api/chat
                              │   1. Embed question (OpenAI)
                              │   2. pgvector similarity search
                              │   3. Send context + question → Claude
                              │   4. Stream response with citations
                              ├── POST /api/upload
                              │   1. Parse PDF/PPTX/DOCX
                              │   2. Chunk text (~500 tokens, 50 overlap)
                              │   3. Embed chunks (OpenAI)
                              │   4. Store in pgvector
                              ├── POST /api/auth
                              │   Simple password → session cookie
                              ├── POST /api/exam/generate
                              │   1. Retrieve chunks for selected course/lecture
                              │   2. Claude generates exam question + rubric
                              │   3. Returns question + metadata
                              ├── POST /api/exam/grade
                              │   1. Student answer + question + rubric
                              │   2. Claude grades against rubric + source material
                              │   3. Returns score, feedback, source refs
                              ├── GET /api/documents
                              │   List indexed documents (admin)
                              └── DELETE /api/documents/:id
                                  Remove document + chunks (admin)
                                      │
                              Vercel Postgres + pgvector
                              ├── courses
                              ├── documents
                              └── chunks (with VECTOR(1536))
```

### Chat Flow

1. User submits question (text or voice)
2. Question embedded via OpenAI text-embedding-3-small
3. Cosine similarity search in pgvector → top 8 candidates (threshold > 0.7)
4. Re-rank: boost high-priority documents (must-read, exam, slides) → return top 5
5. Optional: filter by course slug if course badge selected
5. System prompt + retrieved chunks + source metadata + question → Claude Sonnet 4
6. Streaming response returned with source citations
7. If voice enabled: browser SpeechSynthesis reads answer aloud

### Exam Prep Flow

1. Student selects course/lecture scope and question type
2. Server retrieves random chunks from selected scope
3. Claude generates exam-style question + internal rubric (not shown to student) based on chunks
4. Student types answer in text area
5. Student submits → server sends: question + rubric + student answer + source chunks → Claude
6. Claude grades: score (1-10), what was correct, what was missed, model answer with source citations
7. Student can request "Next Question" to continue

**Question types:**
- **Open-ended**: "Explain the role of CTI in organizational decision-making"
- **Scenario-based**: "Your organization detected APT activity. As CISO, outline your response plan"
- **Compare-and-contrast**: "Compare state-sponsored vs cybercriminal threat actors in terms of motivation and capability"

**Grading rubric (internal, generated per question):**
- Key concepts that must be covered (from source material)
- Depth expected (surface vs analytical)
- Source-backed scoring — points tied to specific course content

### Upload Flow

1. Admin uploads file via drag-and-drop UI
2. Selects course and lecture number
3. Server parses file:
   - PDF → pdf-parse (extracts text per page)
   - PPTX → pptx-parser (extracts text per slide)
   - DOCX → mammoth (extracts text with sections)
4. Text split into ~500-token chunks with 50-token overlap
5. Each chunk embedded via OpenAI
6. Chunks stored in pgvector with document/page metadata
7. Document record created with chunk count

## Data Model

### courses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | "Foundations", "Strategy & Leadership", etc. |
| slug | VARCHAR | UNIQUE, used for filtering |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### documents
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| course_id | UUID | FK → courses |
| lecture_number | INT | 1, 2, 3, 4... |
| filename | VARCHAR | Original filename |
| file_type | VARCHAR | pdf, pptx, docx |
| total_pages | INT | Page/slide count |
| chunk_count | INT | Number of chunks generated |
| priority | VARCHAR | "high" (must-read, exam, slides, important) or "normal" (nice-to-have, supplementary) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### chunks
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| document_id | UUID | FK → documents (CASCADE delete) |
| content | TEXT | ~500 tokens of source text |
| embedding | VECTOR(1536) | pgvector, OpenAI text-embedding-3-small |
| page_number | INT | Page/slide where chunk starts |
| chunk_index | INT | Order within document |
| created_at | TIMESTAMPTZ | |

### Indexes
- `ivfflat` on `chunks.embedding` (cosine ops, lists=10)
- B-tree on `chunks.document_id`
- B-tree on `documents.course_id`
- Unique on `courses.slug`

## UI Design

### Theme
- Light theme with clean, professional look
- Indigo (#6366f1) as primary accent
- Course badges: indigo (Foundations), green (Strategy), amber (Threats)

### Screens

**Login** — centered card with password input, CLA branding

**Chat** — full-height layout:
- Header: logo + course filter badges
- Messages: user bubbles (right, indigo) + AI responses (left, white card) with source citation blocks
- Input bar: mic button (hold-to-talk) + text input + send button
- "Hold 🎤 to speak · answers read aloud automatically" hint

**Admin** (password-gated):
- Drag-and-drop file upload area
- Course + lecture selector
- Table of indexed documents with delete action

**Exam Prep** — separate tab/mode:
- Course + lecture selector (or "all material")
- Question type selector: open-ended, scenario-based, compare-and-contrast
- "Generate Question" button → AI creates question from course material
- Text area for student to type answer
- "Submit Answer" → AI grades with score (1-10), detailed feedback, correct answer with source citations
- "Next Question" to continue practicing
- Running score tracker for the session

### Voice (Browser)
- Hold-to-talk button next to text input
- Web Speech API for speech-to-text (Chrome/Safari native)
- Browser SpeechSynthesis for reading answers aloud
- Auto read-aloud toggle
- Zero install for classmates

### ~~OpenWhisperer Integration~~ — Removed
Browser voice for all users. No separate OpenWhisperer integration needed.

## Authentication

- Single shared password stored as env var `CLASS_PASSWORD`
- Admin password stored as env var `ADMIN_PASSWORD`
- Session cookie set on successful auth (httpOnly, secure, 7-day TTL)
- No individual user accounts

## Edge Cases

- **Zero search results** (similarity < 0.7): Claude responds with "I couldn't find relevant information in the course materials. Try rephrasing or selecting a specific course." — no hallucinated answers.
- **Re-upload same file**: Delete existing document + chunks for that filename/course/lecture, then re-ingest. Prevents duplicates.

## Environment Variables

```
# Database
POSTGRES_URL=              # Vercel Postgres connection string

# AI
ANTHROPIC_API_KEY=         # Claude API
OPENAI_API_KEY=            # Embeddings only

# Auth
CLASS_PASSWORD=            # Shared class password
ADMIN_PASSWORD=            # Admin upload access

# App
NEXT_PUBLIC_APP_NAME=CLA Knowledgebase
```

## Estimated Scale

- Total: ~60 files across 3 courses, 194MB on disk
- Chunks: ~8-12K estimated (dense academic PDFs)
- Vector storage: ~75MB estimated
- Vercel Postgres free tier: 256MB — sufficient

## Content Inventory

Source: `/Users/peripan/Desktop/CLA`

### Foundations 1 (6 lectures, flat folder)
- Slides: Foundations I - 1 through 6 (PPTX/PDF) — **HIGH priority**
- Summary reader — **HIGH priority**
- Use cases (lectures 2-5, DOCX) — **HIGH priority**
- Reading materials: WEF Global Outlook, NIST CSF case study, cognitive biases, Safety-II approach, etc. — normal priority
- 22 files total

### Strategy & Leadership (6 lectures)
- Lecture 1: Corporate structures for CISOs — **HIGH priority** (slides)
- Lecture 2: Leadership roles + 2 reading papers
- Lecture 3: CISO yesterday/today/tomorrow — **HIGH priority**
- Lecture 4: Business to cyber strategy + Walmart case
- Lecture 5: How to organise and execute — **HIGH priority**
- Lecture 6: CISO in VUCA world (**important-** prefix) + 2 reading articles
- 11 files total

### Threat Landscape (6 lectures + exam)
- Model Exam Questions (**important-** prefix) — **HIGH priority**
- Lecture 1: 7 files (slides + 6 must-read: ENISA, MITRE ATT&CK, Diamond Model, Kill Chain)
- Lecture 2: slides + 3 must-read materials
- Lecture 3: slides + 1 must-read + 3 nice-to-have/in-depth
- Lecture 4: slides + 4 must-read (MITRE ATT&CK focus) + exercise
- Lecture 5: slides + 3 must-read (CTI-CMM, TLP, NIST SP 800-150)
- Lecture 6: slides + 2 must-read + 1 nice-to-read (TIBER-EU)
- 27 files total

### Content Priority Detection (auto from filename)
- **HIGH**: contains "must-read", "Must-read", "Must read", "important-", "Slides", "Exam", "summary", "use case", `.pptx`
- **NORMAL**: contains "Nice-to-have", "In-depth", "Nice-to-read", or none of the above

## Key Decisions

1. **OpenAI for embeddings only** — text-embedding-3-small is $0.02/1M tokens, best quality/cost for vector search. Claude handles all reasoning.
2. **500-token chunks, 50-token overlap** — balances context window vs specificity for mixed content (dense papers vs sparse slides).
3. **pgvector over Pinecone/Chroma** — single database, no extra vendor, sufficient for this scale, native to Vercel Postgres.
4. **Browser Web Speech API for classmate voice** — zero install, good-enough quality for study sessions. No server-side STT/TTS needed for the deployed app.
5. **Separate admin password** — simple but effective access control for upload functionality.
