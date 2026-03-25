import Groq from 'groq-sdk';
import { SUMMARIZATION_MODEL, MAX_SUMMARY_INPUT_LENGTH } from '@/lib/config';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Summarize chunk text using Groq (Llama 3.3 70B).
 */
export async function summarizeChunks(chunkTexts: string[]): Promise<string> {
  const combined =
    chunkTexts.join('\n\n').slice(0, MAX_SUMMARY_INPUT_LENGTH) ||
    'No content to summarize.';

  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: SUMMARIZATION_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Summarize the following document chunks concisely in a few sentences. Capture the main topics and key points.',
      },
      { role: 'user', content: combined },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const result = response.choices[0]?.message?.content;
  return typeof result === 'string' ? result.trim() : 'Summary unavailable.';
}
