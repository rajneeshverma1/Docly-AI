import { GoogleGenAI } from '@google/genai';

const EMBEDDING_MODEL = 'text-embedding-004';
const SUMMARIZATION_MODEL = 'gemini-2.0-flash';
const MAX_SUMMARY_INPUT_LENGTH = 12000;

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Create an embedding vector using Gemini text-embedding-004.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response from Gemini');
  }
  return embedding.map((v) => (typeof v === 'number' ? v : Number(v)));
}

/**
 * Summarize chunk text using Gemini 1.5 Flash.
 */
export async function summarizeChunks(chunkTexts: string[]): Promise<string> {
  const combined =
    chunkTexts.join('\n\n').slice(0, MAX_SUMMARY_INPUT_LENGTH) ||
    'No content to summarize.';

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: SUMMARIZATION_MODEL,
    contents: `Summarize the following document chunks concisely in a few sentences. Capture the main topics and key points.\n\n${combined}`,
    config: {
      maxOutputTokens: 500,
      temperature: 0.3,
    },
  });

  const text = response.text;
  return typeof text === 'string' ? text.trim() : 'Summary unavailable.';
}
