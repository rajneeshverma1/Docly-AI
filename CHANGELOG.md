# Changelog

All notable changes to Docly AI are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025-03-25

### Added
- Initial release of Docly AI (forked and extended from SmartDoc AI scaffold)
- PDF upload with SHA-256 deduplication
- Adaptive RAG pipeline: cosine similarity (small corpus) + BM25 + RRF + Jina rerank (large corpus)
- Groq Llama 3.3 70B streaming chat with source citations
- Jina AI embeddings (`jina-embeddings-v3`) and reranking (`jina-reranker-v2-base-multilingual`)
- Groq summarization on upload
- Optional Langfuse observability (traces, TTFT, pre/post-rerank logging)
- Optional Bull + Redis async PDF processing queue
- Black & white monochrome UI (shadcn/ui + Tailwind CSS)
- Copy-to-clipboard on AI responses
- Character counter (2000 char limit) in chat input
- Document count badge (X/3) in sidebar
- Centralised config (`lib/config.ts`) — no more magic numbers
- Structured JSON logger (`lib/logger.ts`)
- Prisma schema indexes: `@@index([documentId])`, `@@index([name])`, `@@index([uploadedAt])`, `@@unique([documentId, chunkIndex])`
- Zod input validation on chat API route
- `LICENSE` (MIT, dual copyright)
- `.env.example` for clean onboarding
- `CONTRIBUTING.md`

### Changed
- Renamed project from WikiMind-RAG → Docly AI
- Rewrote `README.md` — accurate stack, architecture diagram, setup guide
- Replaced all unsafe `JSON.parse(chunk.embedding)` with `parseEmbedding()` helper
- Fixed division-by-zero in `cosineSimilarity()` when vectors have zero magnitude
- Cleaned `.gitignore` — removed duplicates, added `memory/`, `.vscode/`

### Fixed
- `cosineSimilarity` returned `NaN` for zero-magnitude vectors
- Chat API accepted unbounded message length (now capped at 2000 chars)
- `DocumentChunk` had no unique constraint — duplicate chunks possible on retry

---

## [0.x] — Pre-fork (SmartDoc AI scaffold)

Original scaffold by dishafaujdar / WikiMind-RAG contributors.
See original repository for history prior to this fork.

- Dev note 9: incremental maintenance update on 2026-03-04.

- Dev note 19: incremental maintenance update on 2026-03-14.

- Dev note 29: incremental maintenance update on 2026-03-24.
