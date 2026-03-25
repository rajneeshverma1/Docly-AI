/**
 * Bull worker: processes PDF jobs from the queue.
 * Run with: npx tsx scripts/run-pdf-worker.ts
 * Requires REDIS_URL and same env as the app (DB, Jina, Groq, etc.).
 */

import { getPdfQueue } from '../lib/queue';
import { processPdf } from '../lib/pdf-processor';
import { cacheDel } from '../lib/redis';

async function main() {
  const queue = getPdfQueue();
  if (!queue) {
    console.error('REDIS_URL is not set. Worker cannot run.');
    process.exit(1);
  }

  console.log('[PDF worker] Started, waiting for jobs...');

  queue.process(async (job) => {
    const { fileName, fileBufferBase64, contentHash } = job.data;
    const buffer = Buffer.from(fileBufferBase64, 'base64');
    console.log(`[PDF worker] Processing job ${job.id}: ${fileName}`);
    const result = await processPdf(buffer, fileName, contentHash);
    await cacheDel('documents:list');
    console.log(`[PDF worker] Job ${job.id} completed: ${result.document.chunks} chunks`);
    return result;
  });

  queue.on('error', (err) => console.error('[PDF worker] Queue error:', err));
  queue.on('failed', (job, err) =>
    console.error(`[PDF worker] Job ${job?.id} failed:`, err.message)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
