'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DocumentList from '@/components/DocumentList';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import LoadingDots from '@/components/LoadingDots';
import { Message, DocumentMetadata, DocumentSourceType } from '@/types';

const ALL_DOCS_KEY = 'all';

export default function ChatPage() {
  const [messagesByDocument, setMessagesByDocument] = useState<Record<string, Message[]>>({});
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatKey = selectedDocument ?? ALL_DOCS_KEY;
  const messages = messagesByDocument[chatKey] ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const pollJobUntilComplete = async (jobId: string): Promise<void> => {
    const maxAttempts = 120; // ~2 min at 1s interval
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`/api/jobs/${jobId}`);
      const job = await res.json();
      if (job.state === 'completed' && job.result?.document) {
        toast({
          title: 'Success!',
          description: `${job.result.document.name} processed successfully`,
        });
        await fetchDocuments();
        return;
      }
      if (job.state === 'failed') {
        throw new Error(job.error || 'Processing failed');
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('Processing timed out');
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 400 && data.error) {
        toast({
          title: 'Upload limit',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      if (response.status === 202 && data.jobId) {
        toast({
          title: 'Queued',
          description: 'PDF is being processed in the background...',
        });
        await pollJobUntilComplete(data.jobId);
      } else if (response.ok && data.document) {
        toast({
          title: 'Success!',
          description: `${data.document.name} uploaded successfully`,
        });
        await fetchDocuments();
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadLink = async (params: {
    sourceType: DocumentSourceType;
    name: string;
    sourceUrl: string;
  }) => {
    setIsUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      if (response.status === 400 && data.error) {
        toast({
          title: 'Upload limit',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      toast({
        title: 'Success!',
        description: `${data.document.name} added`,
      });
      await fetchDocuments();
    } catch (error) {
      toast({
        title: 'Failed to add',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentName: string) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName }),
      });

      if (response.ok) {
        toast({
          title: 'Document deleted',
          description: `${documentName} has been removed`,
        });
        await fetchDocuments();
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (documents.length === 0) {
      toast({
        title: 'No documents',
        description: 'Please upload a PDF first',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = { role: 'user', content };
    setMessagesByDocument((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] ?? []), userMessage],
    }));
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          documentName: selectedDocument ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const traceId = response.headers.get('X-Langfuse-Trace-Id') ?? undefined;
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessagesByDocument((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] ?? []), { role: 'assistant', content: '', traceId }],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        setMessagesByDocument((prev) => {
          const list = prev[chatKey] ?? [];
          const newList = [...list];
          const last = newList[newList.length - 1];
          newList[newList.length - 1] = { ...last, content: assistantMessage };
          return { ...prev, [chatKey]: newList };
        });
      }
    } catch (error) {
      toast({
        title: 'Chat failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setMessagesByDocument((prev) => ({
        ...prev,
        [chatKey]: (prev[chatKey] ?? []).slice(0, -1),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What is this document about?',
    'Summarize the key points',
    'What are the main conclusions?',
  ];

  return (
    <div className="flex flex-col h-screen bg-black">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col overflow-hidden`}
        >
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Documents</h2>
              <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-full">
                {documents.length}/3
              </span>
            </div>
            <FileUpload
              onUpload={handleUpload}
              onUploadLink={handleUploadLink}
              isUploading={isUploading}
              documentCount={documents.length}
            />
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <DocumentList
              documents={documents}
              selectedDocument={selectedDocument}
              onSelectDocument={setSelectedDocument}
              onDelete={handleDeleteDocument}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat context + Toggle Sidebar */}
          <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <span className="text-sm text-gray-500 truncate">
              {selectedDocument ? `Chat: ${selectedDocument}` : 'Chat: All documents'}
            </span>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="max-w-md">
                  <h2 className="text-2xl font-semibold mb-4 text-white">
                    {documents.length === 0
                      ? 'Upload a PDF to get started'
                      : selectedDocument
                        ? `Ask me anything about ${selectedDocument}`
                        : 'Ask me anything about your documents'}
                  </h2>
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-4">Suggested questions:</p>
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(question)}
                          className="w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-left text-sm text-gray-300 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, idx) => (
                  <ChatMessage key={idx} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center" />
                    <div className="bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-700">
                      <LoadingDots />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || documents.length === 0}
            placeholder={selectedDocument ? `Ask about ${selectedDocument}...` : 'Ask about your documents...'}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
