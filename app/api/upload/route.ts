import { NextRequest, NextResponse } from 'next/server';
import {
  findDocumentByContentHash,
  prisma,
  createExternalDocument,
} from '@/lib/db';
import { computeContentHash } from '@/lib/hash';
import { addPdfJob, isQueueAvailable } from '@/lib/queue';
import { processPdf } from '@/lib/pdf-processor';
import { cacheDel } from '@/lib/redis';
import { MAX_DOCUMENTS } from '@/lib/config';
import type { DocumentSourceType } from '@/types';

type UploadBody =
  | { file: File }
  | {
      sourceType: 'link' | 'notion' | 'google_docs';
      name: string;
      sourceUrl: string;
      workspaceId?: string;
      uploadedBy?: string;
    };

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      // JSON body: link / notion / google_docs (no file upload)
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
      const { sourceType, name, sourceUrl, workspaceId, uploadedBy } = body as {
        sourceType?: string;
        name?: string;
        sourceUrl?: string;
        workspaceId?: string;
        uploadedBy?: string;
      };
      const allowedTypes: DocumentSourceType[] = ['link', 'notion', 'google_docs'];
      if (
        !sourceType ||
        !allowedTypes.includes(sourceType as DocumentSourceType) ||
        !name ||
        !sourceUrl
      ) {
        return NextResponse.json(
          {
            error:
              'JSON body must include sourceType (link|notion|google_docs), name, and sourceUrl',
          },
          { status: 400 }
        );
      }
      const documentCount = await prisma.document.count();
      if (documentCount >= MAX_DOCUMENTS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_DOCUMENTS} documents allowed. Delete one to upload another.` },
          { status: 400 }
        );
      }
      const doc = await createExternalDocument({
        name,
        sourceType: sourceType as 'link' | 'notion' | 'google_docs',
        sourceUrl,
        workspaceId,
        uploadedBy,
      });
      await cacheDel('documents:list');
      return NextResponse.json({
        success: true,
        document: {
          name: doc.name,
          sourceType: doc.sourceType,
          sourceUrl: doc.sourceUrl,
          chunks: doc.chunks,
          uploadedAt: doc.uploadedAt,
        },
      });
    }

    // Multipart: PDF file upload (optional: sourceType, workspaceId, uploadedBy in form)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceTypeForm = formData.get('sourceType') as string | null;
    const workspaceIdForm = formData.get('workspaceId') as string | null;
    const uploadedByForm = formData.get('uploadedBy') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. For link/Notion/Google Docs use POST with JSON body.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentHash = computeContentHash(buffer);
    const existing = await findDocumentByContentHash(contentHash);

    if (!existing) {
      const documentCount = await prisma.document.count();
      if (documentCount >= MAX_DOCUMENTS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_DOCUMENTS} documents allowed. Delete one to upload another.` },
          { status: 400 }
        );
      }
    }

    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: { name: file.name, uploadedAt: new Date() },
      });
      return NextResponse.json({
        success: true,
        duplicate: true,
        document: {
          name: file.name,
          numPages: existing.numPages,
          chunks: existing._count.chunks,
          summary: existing.summary ?? undefined,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    const options = {
      ...(workspaceIdForm && { workspaceId: workspaceIdForm }),
      ...(uploadedByForm && { uploadedBy: uploadedByForm }),
    };

    if (isQueueAvailable()) {
      const jobId = await addPdfJob({
        fileName: file.name,
        fileBufferBase64: buffer.toString('base64'),
        contentHash,
      });
      if (jobId) {
        return NextResponse.json(
          { success: true, jobId, message: 'PDF queued for processing' },
          { status: 202 }
        );
      }
    }

    const result = await processPdf(buffer, file.name, contentHash, options);
    await cacheDel('documents:list');
    return NextResponse.json({
      success: true,
      document: result.document,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
