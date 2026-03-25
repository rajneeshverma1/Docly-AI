/**
 * Jina Embeddings API — no SDK, pure fetch.
 * 1M free tokens on signup at jina.ai
 */

const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';
const JINA_MODEL = 'jina-embeddings-v3';


export async function createEmbedding(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY is not set');

  const response = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      input: texts,
      task: 'retrieval.passage',
      truncate: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jina embeddings failed: ${response.status} ${err}`);
  }

  const data = await response.json() as {
    data: Array<{ index: number; embedding: number[] }>
  };

  return data.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

/**
 * Embed the user's query for retrieval (uses retrieval.query task).
 * Use this for search; use createEmbedding for indexing passages.
 */
export async function createQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('JINA_API_KEY is not set in environment variables.');
  }

  const response = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      input: [query],
      task: 'retrieval.query',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jina embeddings failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    data: Array<{ index: number; embedding: number[] }>;
  };
  return data.data[0]?.embedding ?? [];
}

const JINA_RERANK_URL = 'https://api.jina.ai/v1/rerank';
const JINA_RERANKER_MODEL = 'jina-reranker-v2-base-multilingual';

/**
 * Rerank documents by relevance to the query using Jina reranker API.
 * @param query - search query
 * @param documents - array of document strings (e.g. chunk texts)
 * @param topN - number of results to return (default 5)
 * @returns array of { index: originalIndex, relevance_score } sorted by score desc
 */
export async function rerank(
  query: string,
  documents: string[],
  topN: number = 5
): Promise<Array<{ index: number; relevance_score: number }>> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY is not set');
  if (documents.length === 0) return [];

  const response = await fetch(JINA_RERANK_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JINA_RERANKER_MODEL,
      query,
      documents,
      top_n: Math.min(topN, documents.length),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jina reranker failed: ${response.status} ${err}`);
  }

  const data = (await response.json()) as {
    results: Array<{ index: number; relevance_score: number }>;
  };
  return data.results ?? [];
}
