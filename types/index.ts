export interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Langfuse trace ID — set for assistant messages for feedback */
  traceId?: string;
}

export type DocumentSourceType = 'pdf' | 'link' | 'notion' | 'google_docs';

/** Standardised API error shape returned by all routes */
export interface ApiError {
  error: string;
  code?: string;
}

export interface DocumentMetadata {
  name: string;
  sourceType?: DocumentSourceType;
  sourceUrl?: string | null;
  numPages?: number | null;
  chunks: number;
  summary?: string | null;
  uploadedAt: string;
  workspaceId?: string | null;
  uploadedBy?: string | null;
}

export interface ChunkMetadata {
  documentName: string;
  chunkIndex: number;
  startWord: number;
}

export interface DocumentChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface VectorStoreItem {
  embedding: number[];
  text: string;
  metadata: ChunkMetadata;
}

export interface SearchResult extends VectorStoreItem {
  similarity: number;
}

/** Upload/processing lifecycle states for a document */
export enum DocumentStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}

// Dev note 10: incremental maintenance update on 2026-03-05.

// Dev note 20: incremental maintenance update on 2026-03-15.

// Dev note 30: incremental maintenance update on 2026-03-25.

// Dev note 10: incremental maintenance update on 2026-03-05.
