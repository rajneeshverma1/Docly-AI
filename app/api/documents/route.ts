import { NextRequest, NextResponse } from 'next/server';
import { getDocuments, deleteDocument } from '@/lib/db';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

const DOCUMENTS_CACHE_KEY = 'documents:list';

export async function GET() {
  try {
    const cached = await cacheGet(DOCUMENTS_CACHE_KEY);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
    const documents = await getDocuments();
    const payload = JSON.stringify({ documents });
    await cacheSet(DOCUMENTS_CACHE_KEY, payload, 60);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { documentName } = await request.json();
    if (!documentName) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      );
    }

    await deleteDocument(documentName);
    await cacheDel(DOCUMENTS_CACHE_KEY);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
