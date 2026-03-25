import { PrismaClient } from '@prisma/client';
import { SearchResult, DocumentMetadata, DocumentSourceType } from '@/types';
import { rerank as jinaRerank } from '@/lib/jina';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Safely parse a JSON embedding string; returns empty array on failure. */
function parseEmbedding(raw: string): number[] {
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

/** Cosine similarity between two vectors. */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/** Total child chunks in corpus (or in one document when documentName is set). */
export async function getTotalChunksInCorpus(documentName?: string): Promise<number> {
  if (documentName) {
    return prisma.documentChunk.count({
      where: { document: { name: documentName } },
    });
  }
  return prisma.documentChunk.count();
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(Boolean);
}

/** BM25 scoring — returns a score per document in the same order as docs[]. */
function bm25Score(query: string, docs: string[], k1 = 1.2, b = 0.75): number[] {
  const queryTerms = tokenize(query);
  const docTokens = docs.map(tokenize);
  const N = docs.length;
  const avgLen = docTokens.reduce((s, t) => s + t.length, 0) / N || 1;
  const df: Record<string, number> = {};
  for (const terms of docTokens) {
    const seen = new Set<string>();
    for (const t of terms) {
      if (!seen.has(t)) {
        df[t] = (df[t] ?? 0) + 1;
        seen.add(t);
      }
    }
  }
  const idf = (t: string) =>
    Math.log((N - (df[t] ?? 0) + 0.5) / ((df[t] ?? 0) + 0.5) + 1);
  return docTokens.map((terms) => {
    let score = 0;
    const len = terms.length;
    for (const q of queryTerms) {
      const f = terms.filter((x) => x === q).length;
      if (f === 0) continue;
      score += idf(q) * (f * (k1 + 1)) / (f + k1 * (1 - b + (b * len) / avgLen));
    }
    return score;
  });
}

/** Reciprocal Rank Fusion (k=60). Returns merged list sorted by score desc. */
function rrfMerge(rankedIds: string[][], k = 60): { id: string; score: number }[] {
  const scores: Record<string, number> = {};
  for (const list of rankedIds) {
    list.forEach((id, rank) => {
      scores[id] = (scores[id] ?? 0) + 1 / (k + rank + 1);
    });
  }
  return Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

export interface SearchVectorStoreOptions {
  topK?: number;
  documentName?: string;
  onLargePathResult?: (info: {
    preRerankChunks: SearchResult[];
    postRerankChunks: SearchResult[];
  }) => void;
}

/**
 * Adaptive retrieval:
 *  - Small corpus (<100 chunks): cosine similarity, top-K.
 *  - Large corpus: BM25 + cosine → RRF (top 20) → Jina rerank → top-K.
 */
export async function searchVectorStore(
  queryText: string,
  queryEmbedding: number[],
  totalChunks: number,
  options: SearchVectorStoreOptions = {}
): Promise<SearchResult[]> {
  const topK = options.topK ?? 5;
  const allChunks = await prisma.documentChunk.findMany({
    where: options.documentName
      ? { document: { name: options.documentName } }
      : undefined,
    include: { document: true },
  });

  if (allChunks.length === 0) return [];

  const toSearchResult = (
    chunk: (typeof allChunks)[0],
    similarity: number
  ): SearchResult => ({
    embedding: parseEmbedding(chunk.embedding),
    text: chunk.text,
    metadata: {
      documentName: chunk.document.name,
      chunkIndex: chunk.chunkIndex,
      startWord: chunk.startWord,
    },
    similarity,
  });

  // Small corpus path — simple cosine similarity
  if (totalChunks < 100) {
    const withScores = allChunks.map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, parseEmbedding(chunk.embedding)),
    }));
    withScores.sort((a, b) => b.similarity - a.similarity);
    return withScores.slice(0, topK).map(({ chunk, similarity }) =>
      toSearchResult(chunk, similarity)
    );
  }

  // Large corpus path — BM25 + cosine → RRF → Jina rerank
  const RRF_K = 60;
  const TOP_AFTER_RRF = 20;

  const cosineRanked = allChunks
    .map((chunk) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, parseEmbedding(chunk.embedding)),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_AFTER_RRF);

  const bm25Scores = bm25Score(queryText, allChunks.map((c) => c.text));
  const bm25Ranked = allChunks
    .map((chunk, i) => ({ chunk, score: bm25Scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_AFTER_RRF);

  const rrfResult = rrfMerge(
    [cosineRanked.map((r) => r.chunk.id), bm25Ranked.map((r) => r.chunk.id)],
    RRF_K
  ).slice(0, TOP_AFTER_RRF);

  const idToChunk = new Map(allChunks.map((c) => [c.id, c]));
  const preRerankChunks: SearchResult[] = rrfResult.map(({ id }) => {
    const chunk = idToChunk.get(id)!;
    return toSearchResult(
      chunk,
      cosineSimilarity(queryEmbedding, parseEmbedding(chunk.embedding))
    );
  });

  const reranked = await jinaRerank(
    queryText,
    preRerankChunks.map((r) => r.text),
    topK
  );

  const postRerankChunks: SearchResult[] = reranked.map((r) => ({
    ...preRerankChunks[r.index],
    similarity: r.relevance_score,
  }));

  options.onLargePathResult?.({ preRerankChunks, postRerankChunks });

  return postRerankChunks;
}

export async function addToVectorStore(
  embedding: number[],
  text: string,
  _documentName: string,
  chunkIndex: number,
  startWord: number,
  documentId: string
): Promise<void> {
  await prisma.documentChunk.create({
    data: {
      documentId,
      text,
      embedding: JSON.stringify(embedding),
      chunkIndex,
      startWord,
    },
  });
}

export async function findDocumentByContentHash(contentHash: string) {
  return prisma.document.findUnique({
    where: { contentHash },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function getDocuments(): Promise<DocumentMetadata[]> {
  const docs = await prisma.document.findMany({
    include: { _count: { select: { chunks: true } } },
    orderBy: { uploadedAt: 'desc' },
  });
  return docs.map((doc) => ({
    name: doc.name,
    sourceType: (doc.sourceType as DocumentSourceType) ?? 'pdf',
    sourceUrl: doc.sourceUrl ?? undefined,
    numPages: doc.numPages ?? undefined,
    chunks: doc._count.chunks,
    summary: doc.summary ?? undefined,
    uploadedAt: doc.uploadedAt.toISOString(),
    workspaceId: doc.workspaceId ?? undefined,
    uploadedBy: doc.uploadedBy ?? undefined,
  }));
}

export async function getChunksByDocumentName(documentName: string) {
  const doc = await prisma.document.findFirst({
    where: { name: documentName },
    include: {
      chunks: {
        orderBy: { chunkIndex: 'asc' },
        select: { chunkIndex: true, startWord: true, text: true, createdAt: true },
      },
    },
  });
  if (!doc) return null;
  return {
    documentName: doc.name,
    numPages: doc.numPages,
    summary: doc.summary ?? undefined,
    uploadedAt: doc.uploadedAt.toISOString(),
    chunkCount: doc.chunks.length,
    chunks: doc.chunks.map((c) => ({
      chunkIndex: c.chunkIndex,
      startWord: c.startWord,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function createExternalDocument(params: {
  name: string;
  sourceType: 'link' | 'notion' | 'google_docs';
  sourceUrl: string;
  workspaceId?: string;
  uploadedBy?: string;
}): Promise<{ name: string; sourceType: string; sourceUrl: string; chunks: number; uploadedAt: string }> {
  const doc = await prisma.document.create({
    data: {
      name: params.name,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      numPages: null,
      totalChunks: 0,
      ...(params.workspaceId != null && { workspaceId: params.workspaceId }),
      ...(params.uploadedBy != null && { uploadedBy: params.uploadedBy }),
    },
  });
  return {
    name: doc.name,
    sourceType: doc.sourceType,
    sourceUrl: doc.sourceUrl!,
    chunks: 0,
    uploadedAt: doc.uploadedAt.toISOString(),
  };
}

export async function deleteDocument(documentName: string): Promise<void> {
  await prisma.document.deleteMany({ where: { name: documentName } });
}

export async function clearVectorStore(): Promise<void> {
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
}
