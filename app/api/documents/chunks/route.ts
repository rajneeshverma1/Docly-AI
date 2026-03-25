import { NextRequest, NextResponse } from 'next/server';
import { getChunksByDocumentName } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const documentName = request.nextUrl.searchParams.get('documentName');
    if (!documentName) {
      return NextResponse.json(
        { error: 'documentName query parameter is required' },
        { status: 400 }
      );
    }

    const data = await getChunksByDocumentName(documentName);
    if (!data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get chunks error:', error);
    return NextResponse.json(
      { error: 'Failed to get chunks' },
      { status: 500 }
    );
  }
}
