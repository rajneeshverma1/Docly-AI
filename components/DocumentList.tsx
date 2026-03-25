'use client';

import { useState } from 'react';
import { FileText, Trash2, Download, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentMetadata } from '@/types';

interface DocumentListProps {
  documents: DocumentMetadata[];
  selectedDocument: string | null;
  onSelectDocument: (documentName: string | null) => void;
  onDelete: (documentName: string) => Promise<void>;
}

function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DocumentList({ documents, selectedDocument, onSelectDocument, onDelete }: DocumentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadChunks = async (documentName: string) => {
    setDownloading(documentName);
    try {
      const res = await fetch(
        `/api/documents/chunks?documentName=${encodeURIComponent(documentName)}`
      );
      if (!res.ok) throw new Error('Failed to fetch chunks');
      const data = await res.json();
      const baseName = documentName.replace(/\.pdf$/i, '') || documentName;
      const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
      downloadJson(data, `${safeName}-chunks.json`);
    } catch (err) {
      console.error('Download chunks error:', err);
    } finally {
      setDownloading(null);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">No documents yet</p>
        <p className="text-xs text-gray-700 mt-1">Upload a PDF to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-2 pr-4">
        <button
          type="button"
          onClick={() => onSelectDocument(null)}
          className={`w-full text-left rounded-lg p-3 border transition-colors flex items-center gap-2 ${
            selectedDocument === null
              ? 'bg-white/10 border-white/30 text-white'
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span className="text-sm font-medium">All documents</span>
        </button>
        {documents.map((doc, index) => {
          const isSelected = selectedDocument === doc.name;
          return (
            <div
              key={index}
              className={`group rounded-lg p-3 border transition-colors flex items-start gap-2 ${
                isSelected ? 'bg-white/10 border-white/30' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0 rounded-md text-red-400/80 hover:text-red-300 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 mt-0.5"
                onClick={(e) => { e.stopPropagation(); onDelete(doc.name); }}
                title="Delete document"
                aria-label={`Delete ${doc.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0 rounded-md text-gray-500 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 mt-0.5"
                onClick={(e) => { e.stopPropagation(); handleDownloadChunks(doc.name); }}
                disabled={downloading === doc.name || doc.chunks === 0}
                title="Download chunks as JSON"
                aria-label={`Download chunks for ${doc.name}`}
              >
                <Download className="w-4 h-4" />
              </Button>
              <button
                type="button"
                onClick={() => onSelectDocument(doc.name)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-white truncate">
                    {doc.name}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {doc.chunks} chunks
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
