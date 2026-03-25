/**
 * Shared PDF processing: parse, chunk, summarize, embed, store.
 * Used by the Bull worker and optionally by the upload route when queue is disabled.
 */

import { parsePDF, chunkText } from '@/lib/pdf-parser';
import { createEmbedding } from '@/lib/jina';
import { summarizeChunks } from '@/lib/groq';
import { prisma, findDocumentByContentHash } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { PdfJobResult } from '@/lib/queue';

// const JINA_CONCURRENCY = 2;
// const JINA_BATCH_DELAY_MS = 1500;

export interface ProcessPdfOptions {
  workspaceId?: string;
  uploadedBy?: string;
}

export async function processPdf(
  buffer: Buffer,
  fileName: string,
  contentHash: string,
  options: ProcessPdfOptions = {}
): Promise<PdfJobResult> {
  const { workspaceId, uploadedBy } = options;
  const existing = await findDocumentByContentHash(contentHash);
  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: { name: fileName, uploadedAt: new Date() },
    });
    return {
      document: {
        name: fileName,
        numPages: existing.numPages ?? 0,
        chunks: existing._count.chunks,
        summary: existing.summary ?? undefined,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  console.time('parsing');
  const { text, numPages } = await parsePDF(buffer, fileName);
  console.timeEnd('parsing');
  logger.info('PDF parsed', { fileName, numPages });

  console.time('chunking');
  const chunks = chunkText(text, fileName);
  console.timeEnd('chunking');
  logger.info('PDF chunked', { fileName, chunkCount: chunks.length });
  if (chunks.length === 0) {
    throw new Error(
      'No text could be extracted from this PDF. It may be image-only (scanned) or Poppler may not be installed.'
    );
  }

  console.time('summarizing');
  const summary = await summarizeChunks(chunks.map((c) => c.text));
  console.timeEnd('summarizing');

  console.time('embedding');
  const embeddings = await createEmbedding(chunks.map((c) => c.text));
  // const embeddings: number[][] = [];
  // for (let i = 0; i < chunks.length; i += JINA_CONCURRENCY) {
  //   const batch = chunks.slice(i, i + JINA_CONCURRENCY);
  //   const batchVectors = await Promise.all(
  //     batch.map((chunk) => createEmbedding([chunk.text]))
  //   );
  //   for (const vecs of batchVectors) {
  //     embeddings.push(...vecs);
  //   }
  //   if (i + JINA_CONCURRENCY < chunks.length) {
  //     await new Promise((r) => setTimeout(r, JINA_BATCH_DELAY_MS));
  //   }
  // }
  console.timeEnd('embedding');

  console.time('storing');
  // Create document and all chunks in one transaction so documentId is visible (avoids FK violation)
  const document = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        name: fileName,
        sourceType: 'pdf',
        numPages: numPages ?? undefined,
        contentHash,
        summary,
        totalChunks: chunks.length,
        ...(workspaceId != null && { workspaceId }),
        ...(uploadedBy != null && { uploadedBy }),
      },
    });
    await Promise.all(
      chunks.map((chunk, i) =>
        tx.documentChunk.create({
          data: {
            documentId: doc.id,
            text: chunk.text,
            embedding: JSON.stringify(embeddings[i]),
            chunkIndex: chunk.metadata.chunkIndex,
            startWord: chunk.metadata.startWord,
          },
        })
      )
    );
    return doc;
  });
  console.timeEnd('storing');

  return {
    document: {
      name: fileName,
      numPages,
      chunks: chunks.length,
      summary,
      uploadedAt: document.uploadedAt.toISOString(),
    },
  };
}
