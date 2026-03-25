/**
 * PDF parsing via Poppler (node-poppler) — pure npm, no Python.
 * Requires Poppler binaries: brew install poppler (macOS) or apt install poppler-utils (Linux).
 */

import { parseWithPoppler } from '@/lib/poppler-parser';
import { CHUNK_SIZE_WORDS, CHUNK_OVERLAP_WORDS } from '@/lib/config';
import type { DocumentChunk } from '@/types';

export interface PDFData {
  text: string;
  numPages: number;
}

export async function parsePDF(buffer: Buffer, _filename?: string): Promise<PDFData> {
  console.log('[PDF parser] Using Poppler (node-poppler)');
  return parseWithPoppler(buffer);
}

export function chunkText(
  text: string,
  documentName: string,
  chunkSize: number = CHUNK_SIZE_WORDS,
  overlap: number = CHUNK_OVERLAP_WORDS
): DocumentChunk[] {
  const words = text.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk,
        metadata: {
          documentName,
          chunkIndex: chunkIndex++,
          startWord: i,
        },
      });
    }
  }

  return chunks;
}
