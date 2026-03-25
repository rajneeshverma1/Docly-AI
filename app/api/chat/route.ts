import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { createQueryEmbedding } from '@/lib/jina';
import { searchVectorStore, getTotalChunksInCorpus } from '@/lib/db';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { CHAT_MODEL, MAX_TOKENS, MAX_MESSAGE_LENGTH } from '@/lib/config';
import {
  startActiveObservation,
  getActiveTraceId,
  updateActiveObservation,
} from '@langfuse/tracing';

const chatBodySchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  documentName: z.string().optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = chatBodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.errors[0]?.message ?? 'Invalid request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { message, documentName } = parsed.data;

    const response = await startActiveObservation('smartdoc-chat', async () => {
      // 1. Query embedding
      const queryEmbedding = await startActiveObservation(
        'embedding-query',
        async (embed) => {
          const start = performance.now();
          const embedding = await createQueryEmbedding(message);
          embed.update({
            input: message,
            metadata: {
              latencyMs: Math.round(performance.now() - start),
              dimensions: embedding.length,
            },
          });
          return embedding;
        },
        { asType: 'embedding' }
      );

      // 2. Retrieval — adaptive by corpus size; optional document scope
      const totalChunks = await getTotalChunksInCorpus(documentName);
      const retrievalPath = totalChunks < 100 ? 'small' : 'large';

      const relevantChunks = await startActiveObservation(
        'retrieval',
        async (retriever) => {
          const start = performance.now();
          let preRerankChunks: { documentName: string; chunkIndex: number; similarity: number; textPreview: string }[] = [];
          let postRerankChunks: { documentName: string; chunkIndex: number; similarity: number; textPreview: string }[] = [];

          const chunks = await searchVectorStore(message, queryEmbedding, totalChunks, {
            topK: 5,
            documentName,
            onLargePathResult: (info) => {
              preRerankChunks = info.preRerankChunks.map((c) => ({
                documentName: c.metadata.documentName,
                chunkIndex: c.metadata.chunkIndex,
                similarity: c.similarity,
                textPreview: c.text.slice(0, 100) + (c.text.length > 100 ? '…' : ''),
              }));
              postRerankChunks = info.postRerankChunks.map((c) => ({
                documentName: c.metadata.documentName,
                chunkIndex: c.metadata.chunkIndex,
                similarity: c.similarity,
                textPreview: c.text.slice(0, 100) + (c.text.length > 100 ? '…' : ''),
              }));
            },
          });

          const latencyMs = Math.round(performance.now() - start);
          retriever.update({
            input: message,
            output: chunks.map((c) => ({
              documentName: c.metadata.documentName,
              chunkIndex: c.metadata.chunkIndex,
              similarity: c.similarity,
              textPreview: c.text.slice(0, 100) + (c.text.length > 100 ? '…' : ''),
            })),
            metadata: {
              retrievalLatencyMs: latencyMs,
              chunkCount: chunks.length,
              topK: 5,
              retrievalPath,
              totalChunks,
              ...(retrievalPath === 'large' && {
                preRerankChunks,
                postRerankChunks,
              }),
            },
          });
          return chunks;
        },
        { asType: 'retriever' }
      );

      if (relevantChunks.length === 0) {
        throw new Error('NO_DOCUMENTS');
      }

      const numberedContext = relevantChunks
        .map((chunk, idx) => {
          return `[${idx + 1}] ${chunk.text}\n[Source: ${chunk.metadata.documentName}, Chunk ${chunk.metadata.chunkIndex + 1}]`;
        })
        .join('\n\n---\n\n');

      const userPrompt = `Retrieved sections:\n${numberedContext}\n\nQuestion: ${message}\n\nIf multiple sections needed, reference them explicitly.`;

      // 3. LLM generation — span wraps the call; we record TTFT when first token arrives
      const genStart = performance.now();
      let ttftRecorded = false;

      const result = await startActiveObservation(
        'llm-generation',
        async (gen) => {
          gen.update({
            model: CHAT_MODEL,
            input: userPrompt,
          });

          const streamResult = await streamText({
            model: groq(CHAT_MODEL),
            system: SYSTEM_PROMPT,
            prompt: userPrompt,
            maxTokens: MAX_TOKENS,
          });

          
          
          const baseResponse = streamResult.toTextStreamResponse();
          const originalStream = baseResponse.body;
          if (!originalStream) {
            return baseResponse;
          }

          const streamWithTTFT = new ReadableStream({
            async start(controller) {
              const reader = originalStream.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (!ttftRecorded && value && value.length > 0) {
                    ttftRecorded = true;
                    const ttftMs = Math.round(performance.now() - genStart);
                    updateActiveObservation(
                      {
                        metadata: { ttftMs },
                        completionStartTime: new Date(genStart + ttftMs),
                      },
                      { asType: 'generation' }
                    );
                  }
                  controller.enqueue(value);
                }
                controller.close();
              } catch (e) {
                controller.error(e);
              }
            },
          });

          const traceId = getActiveTraceId();
          const headers = new Headers(baseResponse.headers);
          if (traceId) {
            headers.set('X-Langfuse-Trace-Id', traceId);
          }

          return new Response(streamWithTTFT, {
            status: baseResponse.status,
            statusText: baseResponse.statusText,
            headers,
          });
        },
        { asType: 'generation' }
      );

      return result;
    });

    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NO_DOCUMENTS') {
      return new Response(
        JSON.stringify({ error: 'No documents found. Please upload a PDF first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('Chat error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Failed to process chat',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}