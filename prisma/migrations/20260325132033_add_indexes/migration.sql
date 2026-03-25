/*
  Warnings:

  - A unique constraint covering the columns `[documentId,chunkIndex]` on the table `document_chunks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkIndex_key" ON "document_chunks"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "documents_name_idx" ON "documents"("name");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");
