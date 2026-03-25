-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'pdf',
    "sourceUrl" TEXT,
    "numPages" INTEGER,
    "summary" TEXT,
    "contentHash" TEXT,
    "totalChunks" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT,
    "uploadedBy" TEXT
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "startWord" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_contentHash_key" ON "documents"("contentHash");
