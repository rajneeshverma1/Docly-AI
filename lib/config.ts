/**
 * Centralised application configuration.
 * All magic numbers and tunable parameters live here.
 */

// ─── Document limits ──────────────────────────────────────────────────────────
export const MAX_DOCUMENTS = 3;
export const MAX_FILE_SIZE_MB = 20;

// ─── Chunking ─────────────────────────────────────────────────────────────────
export const CHUNK_SIZE_WORDS = 500;
export const CHUNK_OVERLAP_WORDS = 100;

// ─── Retrieval ────────────────────────────────────────────────────────────────
export const SMALL_CORPUS_THRESHOLD = 100; // chunks — below this, use cosine only
export const TOP_K = 5;                    // final chunks returned to LLM
export const RRF_K = 60;                   // RRF fusion constant
export const TOP_AFTER_RRF = 20;           // candidates before Jina rerank

// ─── LLM ──────────────────────────────────────────────────────────────────────
export const CHAT_MODEL = 'llama-3.3-70b-versatile';
export const MAX_TOKENS = 1000;
export const MAX_MESSAGE_LENGTH = 2000;

// ─── Summarization ────────────────────────────────────────────────────────────
export const SUMMARIZATION_MODEL = 'llama-3.3-70b-versatile';
export const MAX_SUMMARY_INPUT_LENGTH = 12000;

// ─── Cache ────────────────────────────────────────────────────────────────────
export const CACHE_TTL_SECONDS = 60;
export const DOCUMENTS_CACHE_KEY = 'documents:list';
