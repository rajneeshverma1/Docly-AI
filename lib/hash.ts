import { createHash } from 'crypto';

/**
 * SHA-256 hash of raw file content. Used as dedup key so re-uploading
 * the same PDF does not create duplicate embeddings.
 */
export function computeContentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}