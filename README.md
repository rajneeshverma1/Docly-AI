# Docly AI — Intelligent RAG Document Chat

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Groq-Llama%203.3-orange?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Jina_AI-Embeddings%20%26%20Rerank-purple?style=for-the-badge" alt="Jina AI" />
  <img src="https://img.shields.io/badge/Prisma-5.22-darkblue?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **Docly AI** is an advanced AI-powered Document Intelligence application. Upload your PDFs and have instant, cited conversations with your documents using a production-grade **Retrieval-Augmented Generation (RAG)** pipeline.

---

## ✨ Features

- 📄 **PDF Upload & Ingestion**: Drag & drop PDF uploads with automatic SHA-256 deduplication and text chunking.
- ⚡ **Ultra-Fast RAG Pipeline**: Powered by **Groq Llama 3.3 70B** for lightning-fast answer generation.
- 🔍 **Hybrid Vector Retrieval**: Uses **Jina AI (`jina-embeddings-v3`)** for embeddings and **Jina Reranker (`jina-reranker-v2-base-multilingual`)** for maximum precision context retrieval.
- 🎯 **Cited Responses**: Every AI answer includes exact source citations referencing the specific document and content chunk.
- 🎨 **Minimal Dark Aesthetic**: High-contrast, sleek dark UI built with Tailwind CSS and Radix UI / shadcn components.
- 📊 **Optional Async Queue**: Background job processing support via Bull & Redis for heavy PDF parsing.
- 🔭 **Observability**: Built-in Langfuse integration for tracing LLM latency, token usage, and retrieval telemetry.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14 (App Router)](https://nextjs.org/) + TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Radix UI Primitives |
| **LLM Inference** | [Groq](https://groq.com/) (`llama-3.3-70b-versatile`) |
| **Embeddings** | [Jina AI](https://jina.ai/) (`jina-embeddings-v3`) |
| **Reranking** | Jina Reranker (`jina-reranker-v2-base-multilingual`) |
| **Database** | Prisma ORM + SQLite (Development) / PostgreSQL (Production) |
| **PDF Parsing** | `node-poppler` + `pdf-parse` |
| **Background Queue** | Bull + Redis (Optional) |

---

## ⚙️ Architecture & Pipeline

```
┌─────────────────┐      ┌────────────────────────┐      ┌───────────────────────┐
│ Upload PDF      │ ───► │ SHA-256 Check & Dedupe │ ───► │ Parse Text & Chunk    │
└─────────────────┘      └────────────────────────┘      └───────────────────────┘
                                                                     │
                                                                     ▼
┌─────────────────┐      ┌────────────────────────┐      ┌───────────────────────┐
│ Streamed Answer │ ◄─── │ Groq Llama 3.3 70B RAG │ ◄─── │ Jina Hybrid Rerank    │
│ with Citations  │      │ Prompt Generation      │      │ & Vector Retrieval    │
└─────────────────┘      └────────────────────────┘      └───────────────────────┘
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: `v18+`
- **npm** or **yarn**
- **Poppler Binaries** (for PDF parsing):
  - macOS: `brew install poppler`
  - Linux: `sudo apt-get install poppler-utils`
  - Windows: Auto-installed via `node-poppler`

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/rajneeshverma1/Docly-AI.git
cd Docly-AI
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key"
JINA_API_KEY="your_jina_api_key"
```

### 4. Database Setup
Generate the Prisma Client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## 📁 Folder Structure

```
Docly-AI/
├── app/                  # Next.js App Router (Pages & API Endpoints)
│   ├── page.tsx          # Homepage (Dark Aesthetic Hero Section)
│   ├── chat/page.tsx     # Chat & PDF Upload Workspace
│   └── api/              # RAG, Upload, and Document API routes
├── components/           # React UI Components
│   ├── Header.tsx        # Dark Navigation Bar
│   ├── FileUpload.tsx    # Drag-and-drop PDF uploader
│   ├── ChatMessage.tsx   # Message rendering with citation badges
│   └── DocumentList.tsx  # Document sidebar list
├── lib/                  # Core RAG, Database & AI integrations
│   ├── db.ts             # Prisma vector search & BM25 retrieval
│   ├── jina.ts           # Jina embedding & reranking client
│   └── groq.ts           # Groq LLM integration
├── prisma/               # Database Schema & SQLite Database
└── package.json          # Dependencies & npm scripts
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

Developed with ❤️ by **[Rajneesh Verma](https://github.com/rajneeshverma1)**.
