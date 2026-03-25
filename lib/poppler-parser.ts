/**
 * PDF parsing via Poppler (node-poppler).
 * Uses a temp file so pdftotext/pdfinfo get a real path (more reliable than stdin in Node/Next).
 */

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface ParseResult {
  text: string;
  numPages: number;
}

function getNumPagesFromInfo(info: string | Record<string, string>): number {
  if (typeof info === 'object' && info.Pages) {
    const n = parseInt(info.Pages, 10);
    return Number.isNaN(n) ? 1 : n;
  }
  if (typeof info === 'string') {
    const m = info.match(/Pages:\s*(\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  }
  return 1;
}

/**
 * Extract text and page count from a PDF buffer using Poppler.
 * Writes buffer to a temp file so pdftotext/pdfinfo receive a file path (avoids stdin quirks).
 */
export async function parseWithPoppler(buffer: Buffer): Promise<ParseResult> {
  const tmpPath = join(tmpdir(), `pdf-${randomBytes(8).toString('hex')}.pdf`);
  try {
    await writeFile(tmpPath, buffer);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Poppler = require('node-poppler');
    const Ctor = typeof Poppler === 'function' ? Poppler : (Poppler.default ?? Poppler);
    const poppler = new Ctor();

    const [text, info] = await Promise.all([
      poppler.pdfToText(tmpPath, undefined),
      poppler.pdfInfo(tmpPath).catch(() => 'Pages: 1'),
    ]);

    const numPages = getNumPagesFromInfo(info);
    return {
      text: (text ?? '').trim(),
      numPages,
    };
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
