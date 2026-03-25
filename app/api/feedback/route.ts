import { NextRequest, NextResponse } from 'next/server';
import { LangfuseClient } from '@langfuse/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { traceId, value, comment } = body as {
      traceId: string;
      value: 1 | 0;
      comment?: string;
    };

    if (!traceId || (value !== 1 && value !== 0)) {
      return NextResponse.json(
        { error: 'traceId and value (1 or 0) are required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Langfuse is not configured' },
        { status: 503 }
      );
    }

    const langfuse = new LangfuseClient({
      secretKey,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    });

    langfuse.score.create({
      traceId,
      name: 'user-feedback',
      value,
      dataType: 'BOOLEAN',
      comment: comment ?? undefined,
    });

    await langfuse.flush();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
