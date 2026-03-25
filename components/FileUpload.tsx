'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, Link2 } from 'lucide-react';
import type { DocumentSourceType } from '@/types';

const MAX_DOCUMENTS = 3;

const SOURCE_OPTIONS: { value: DocumentSourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF file' },
  { value: 'link', label: 'Link (URL)' },
  { value: 'notion', label: 'Notion' },
  { value: 'google_docs', label: 'Google Docs' },
];

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  onUploadLink?: (params: {
    sourceType: DocumentSourceType;
    name: string;
    sourceUrl: string;
  }) => Promise<void>;
  isUploading: boolean;
  documentCount: number;
}

export default function FileUpload({
  onUpload,
  onUploadLink,
  isUploading,
  documentCount,
}: FileUploadProps) {
  const [sourceType, setSourceType] = useState<DocumentSourceType>('pdf');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const maxReached = documentCount >= MAX_DOCUMENTS;
  const isLinkType =
    sourceType === 'link' || sourceType === 'notion' || sourceType === 'google_docs';

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (maxReached) return;
      const file = acceptedFiles[0];
      if (file && file.type === 'application/pdf') {
        await onUpload(file);
      }
    },
    [onUpload, maxReached]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading || maxReached,
  });

  const handleSubmitLink = useCallback(async () => {
    if (!onUploadLink || !linkName.trim() || !linkUrl.trim()) return;
    await onUploadLink({
      sourceType,
      name: linkName.trim(),
      sourceUrl: linkUrl.trim(),
    });
    setLinkName('');
    setLinkUrl('');
  }, [onUploadLink, sourceType, linkName, linkUrl]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-300">Source type:</label>
        <select
          value={sourceType}
          onChange={(e) =>
            setSourceType(e.target.value as DocumentSourceType)
          }
          className="rounded-md border border-zinc-700 bg-zinc-900 text-gray-200 text-sm px-3 py-1.5"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLinkType ? (
        <div className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <input
            type="text"
            placeholder="Document name"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-gray-200 text-sm px-3 py-2 placeholder:text-gray-600"
          />
          <input
            type="url"
            placeholder={
              sourceType === 'notion'
                ? 'Notion page URL'
                : sourceType === 'google_docs'
                  ? 'Google Docs URL'
                  : 'https://...'
            }
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-gray-200 text-sm px-3 py-2 placeholder:text-gray-600"
          />
          <button
            type="button"
            onClick={handleSubmitLink}
            disabled={
              isUploading ||
              maxReached ||
              !linkName.trim() ||
              !linkUrl.trim() ||
              !onUploadLink
            }
            className="w-full flex items-center justify-center gap-2 rounded-md bg-white hover:bg-gray-200 text-black text-sm font-medium py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Add {SOURCE_OPTIONS.find((o) => o.value === sourceType)?.label}
          </button>
          {!onUploadLink && (
            <p className="text-xs text-gray-600">
              Link/Notion/Google Docs ingestion not connected in this client.
            </p>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-white bg-white/5'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-white animate-spin" />
                <p className="text-sm text-gray-400">Processing PDF...</p>
              </>
            ) : maxReached ? (
              <>
                <FileText className="w-10 h-10 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Max {MAX_DOCUMENTS} documents
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Delete one to upload another
                  </p>
                </div>
              </>
            ) : (
              <>
                {isDragActive ? (
                  <FileText className="w-10 h-10 text-white" />
                ) : (
                  <Upload className="w-10 h-10 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {isDragActive ? 'Drop PDF here' : 'Upload PDF'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Drag & drop or click to browse
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
