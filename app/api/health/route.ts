/**
 * Health check endpoint — useful for uptime monitors and deployment checks.
 * GET /api/health → { status: "ok", version: "1.0.0", ts: "<ISO>" }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lightweight DB ping
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      version: process.env.npm_package_version ?? '1.0.0',
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'DB unreachable' },
      { status: 503 }
    );
  }
}

// Dev note 3: incremental maintenance update on 2026-02-26.

// Dev note 13: incremental maintenance update on 2026-03-08.

// Dev note 23: incremental maintenance update on 2026-03-18.

// Dev note 3: incremental maintenance update on 2026-02-26.
