# Docly AI — AI-Powered Document Chat

> Built by **[Rajneesh Verma](https://github.com/rajneeshverma1)** · MIT License
> Original scaffold: SmartDoc AI (MIT) — significantly refactored and extended

WikiMind lets you upload PDF documents and have intelligent, cited conversations about their contents — powered by a production-grade RAG (Retrieval-Augmented Generation) pipeline.

---

## What It Does

1. Upload a PDF (drag & drop)
2. The document is parsed, chunked, and embedded using Jina AI
3. Ask any question in natural language
4. The app retrieves the most relevant chunks using hybrid search (BM25 + cosine similarity + Jina reranking)
5. Groq's Llama 3.3 70B streams a cited answer back in real time

---

## My Contributions & Improvements

This project was forked from an open-source scaffold and significantly refactored and extended:

### Refactoring & Code Quality
- Rewrote `lib/db.ts` — extracted `parseEmbedding()` helper, replaced all unsafe `JSON.parse` calls, fixed a division-by-zero bug in `cosineSimilarity`, removed dead code
- Added Zod input validation to the chat API route with a `MAX_MESSAGE_LENGTH` guard
- Added `@@unique([documentId, chunkIndex])`, `@@index([documentId])`, `@@index([name])`, `@@index([uploadedAt])` to the Prisma schema for query performance
- Cleaned up `package.json`: renamed project, bumped to v1.0.0, added `db:generate`, `db:migrate`, `db:studio` scripts

### UI / UX
- Redesigned the entire color scheme from blue/slate to a clean **black & white** monochrome palette
- Updated `app/layout.tsx` metadata (title, description) to reflect the real stack
- Removed stale references to OpenAI/GPT-4o-mini throughout the UI

### Documentation
- Completely rewrote `README.md` — accurate tech stack, real setup steps, architecture diagram, env variable reference, contribution notes, and open-source attribution
- Added `.env.example` for clean onboarding

### Architecture Decisions Preserved
- Adaptive retrieval (small corpus: cosine; large corpus: BM25 + RRF + Jina rerank) — kept as-is, it's well-designed
- Bull + Redis optional queue for async PDF processing — kept, documented clearly
- Langfuse observability integration — kept, documented as optional

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| UI | React 18, Tailwind CSS, shadcn/ui |
| LLM | Groq — `llama-3.3-70b-versatile` |
| Embeddings | Jina AI — `jina-embeddings-v3` |
| Reranking | Jina AI — `jina-reranker-v2-base-multilingual` |
| Summarization | Groq — `llama-3.3-70b-versatile` |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Queue | Bull + Redis (optional, for async PDF processing) |
| Observability | Langfuse + OpenTelemetry (optional) |
| PDF Parsing | node-poppler (Poppler binaries) |

---

## How It Works — Architecture

```
User uploads PDF
      │
      ▼
SHA-256 dedup check ──► duplicate? → return existing
      │
      ▼
Poppler: extract text + page count
      │
      ▼
Chunk text (500 words, 100-word overlap)
      │
      ▼
Groq: summarize all chunks → document summary
      │
      ▼
Jina: batch embed all chunks (retrieval.passage)
      │
      ▼
Prisma: store Document + DocumentChunks in SQLite
      │
      ▼
User asks a question
      │
      ▼
Jina: embed query (retrieval.query)
      │
      ▼
Adaptive retrieval:
  corpus < 100 chunks → cosine similarity top-5
  corpus ≥ 100 chunks → BM25 + cosine → RRF(k=60) → Jina rerank → top-5
      │
      ▼
Groq: stream answer with citations (Llama 3.3 70B)
      │
      ▼
Langfuse: trace embedding latency, TTFT, pre/post-rerank chunks
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Poppler binaries (for PDF parsing)
  - Windows: included via `node-poppler-win32` (auto-installed)
  - macOS: `brew install poppler`
  - Linux: `apt install poppler-utils`

### 1. Clone & install

```bash
git clone https://github.com/your-username/wikimind-rag.git
cd wikimind-rag
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite: `file:./dev.db` · PostgreSQL: `postgresql://...` |
| `GROQ_API_KEY` | ✅ | [console.groq.com](https://console.groq.com) — free tier available |
| `JINA_API_KEY` | ✅ | [jina.ai](https://jina.ai) — 1M free tokens |
| `GEMINI_API_KEY` | ❌ | Optional alternative embedder |
| `REDIS_URL` | ❌ | Enables async PDF queue. Omit for sync processing |
| `LANGFUSE_SECRET_KEY` | ❌ | Enables tracing. Omit to disable |
| `LANGFUSE_PUBLIC_KEY` | ❌ | Required if secret key is set |
| `LANGFUSE_BASE_URL` | ❌ | Defaults to `https://us.cloud.langfuse.com` |
| `CORS_ORIGINS` | ❌ | Defaults to `*` |

### 3. Database setup

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # create tables
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Run the PDF worker

If `REDIS_URL` is set, start the Bull worker in a separate terminal:

```bash
npm run worker
```

---

## Project Structure

```
wikimind-rag/
├── app/
│   ├── layout.tsx              # Root layout, metadata
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind + CSS variables (B&W theme)
│   ├── chat/
│   │   └── page.tsx            # Chat interface
│   └── api/
│       ├── chat/route.ts       # Streaming RAG endpoint (Zod-validated)
│       ├── upload/route.ts     # PDF upload + dedup + queue/sync
│       ├── documents/
│       │   ├── route.ts        # List / delete documents
│       │   └── chunks/route.ts # Export chunks as JSON
│       ├── feedback/route.ts   # Langfuse feedback endpoint
│       ├── health/route.ts     # GET /api/health — DB ping + version
│       └── jobs/[jobId]/route.ts # Bull job status polling
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── Header.tsx
│   ├── ChatMessage.tsx         # Message bubble + feedback buttons
│   ├── ChatInput.tsx           # Textarea + send button
│   ├── FileUpload.tsx          # Dropzone + link/Notion/GDocs form
│   ├── DocumentList.tsx        # Sidebar document list
│   └── LoadingDots.tsx
├── lib/
│   ├── db.ts                   # Prisma client, vector search, BM25, RRF
│   ├── jina.ts                 # Jina embeddings + reranker
│   ├── groq.ts                 # Groq summarization
│   ├── gemini.ts               # Gemini embeddings (optional)
│   ├── pdf-parser.ts           # Chunking logic
│   ├── poppler-parser.ts       # Poppler PDF → text
│   ├── pdf-processor.ts        # Orchestrates parse → embed → store
│   ├── queue.ts                # Bull queue helpers
│   ├── redis.ts                # Redis cache helpers
│   ├── hash.ts                 # SHA-256 content hash
│   ├── config.ts               # Centralised constants (chunk size, top-K, models)
│   ├── errors.ts               # Typed error classes (AppError, ValidationError…)
│   ├── logger.ts               # Structured JSON logger
│   ├── prompts.ts              # System prompt
│   └── utils.ts                # cn() utility
├── prisma/
│   ├── schema.prisma           # Document + DocumentChunk models
│   └── migrations/
├── scripts/
│   └── run-pdf-worker.ts       # Bull worker entry point
├── types/
│   └── index.ts                # Shared TypeScript types
├── instrumentation.ts          # OpenTelemetry + Langfuse setup
├── .env.example
├── docker-compose.yml          # PostgreSQL + Redis for production
└── next.config.js
```

---

## Docker (PostgreSQL + Redis)

For production-like local setup:

```bash
docker compose up -d
```

Then update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartdoc"
REDIS_URL=redis://localhost:6379
```

Re-run migrations:

```bash
npm run db:migrate
```

---

## Known Limitations

- No authentication — all users share the same document store
- Max 3 documents per session (configurable in `app/api/upload/route.ts`)
- Vector search loads all chunks into memory (fine for <10k chunks; use pgvector for larger corpora)
- Notion and Google Docs source types are registered but content ingestion is not yet implemented

---

## Roadmap

- [ ] Authentication (Clerk / Auth0)
- [ ] Per-user document isolation
- [ ] pgvector for scalable vector search
- [ ] Notion API content ingestion
- [ ] Google Docs API content ingestion
- [ ] Chat history persistence
- [ ] Export conversation as PDF/Markdown
- [ ] Rate limiting on API routes

---

## License

MIT — see [LICENSE](LICENSE).

Original scaffold: **SmartDoc AI** — MIT License.
Modifications and extensions: **Rajneesh Verma**, 2025.

---

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Groq](https://groq.com/) — ultra-fast LLM inference
- [Jina AI](https://jina.ai/) — embeddings and reranking
- [Prisma](https://prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Langfuse](https://langfuse.com/) — LLM observability

- Dev note 1: incremental maintenance update on 2026-02-24.

- Dev note 11: incremental maintenance update on 2026-03-06.

- Dev note 21: incremental maintenance update on 2026-03-16.

- Dev note 1: incremental maintenance update on 2026-02-24.
