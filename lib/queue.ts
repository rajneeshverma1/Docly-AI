/**
 * Bull queue for PDF processing. Requires REDIS_URL.
 * When Redis is not set, addPdfJob returns null and upload can fall back to sync processing.
 */

import Queue from 'bull';
import { getRedisOptions, isRedisAvailable } from './redis';

const PDF_QUEUE_NAME = 'smartdoc-pdf';

export interface PdfJobData {
  fileName: string;
  fileBufferBase64: string;
  contentHash: string;
}

export interface PdfJobResult {
  document: {
    name: string;
    numPages: number;
    chunks: number;
    summary?: string;
    uploadedAt: string;
  };
}

let pdfQueue: Queue.Queue<PdfJobData> | null = null;

function getPdfQueue(): Queue.Queue<PdfJobData> | null {
  if (!isRedisAvailable()) return null;
  if (!pdfQueue) {
    const redisOpts = getRedisOptions();
    if (!redisOpts) return null;
    pdfQueue = new Queue<PdfJobData>(PDF_QUEUE_NAME, {
      redis: redisOpts,
      defaultJobOptions: {
        removeOnComplete: 100,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }
  return pdfQueue;
}

/** Add a PDF processing job. Returns job id if queue is available, else null. */
export async function addPdfJob(data: PdfJobData): Promise<string | null> {
  const queue = getPdfQueue();
  if (!queue) return null;
  const job = await queue.add(data);
  return job.id?.toString() ?? null;
}

/** Get job state and result for polling. */
export async function getPdfJob(
  jobId: string
): Promise<{ state: string; result?: PdfJobResult; error?: string } | null> {
  const queue = getPdfQueue();
  if (!queue) return null;
  const job = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  const result: { state: string; result?: PdfJobResult; error?: string } = { state };
  if (state === 'completed' && job.returnvalue) {
    result.result = job.returnvalue as PdfJobResult;
  }
  if (state === 'failed' && job.failedReason) {
    result.error = job.failedReason;
  }
  return result;
}

export function isQueueAvailable(): boolean {
  return isRedisAvailable();
}

export { getPdfQueue };
