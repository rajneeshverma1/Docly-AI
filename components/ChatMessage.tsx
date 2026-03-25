'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleFeedback = async (value: 1 | 0) => {
    if (!message.traceId || feedback !== null) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId: message.traceId, value }),
      });
      if (res.ok) setFeedback(value === 1 ? 'up' : 'down');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-white' : 'bg-zinc-800'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-black" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-white text-black'
            : 'bg-zinc-900 text-gray-200 border border-zinc-700'
        }`}
      >
        <div className="text-sm prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && message.traceId && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-700">
            <span className="text-xs text-gray-600 mr-1">Helpful?</span>
            <button
              type="button"
              onClick={() => handleFeedback(1)}
              disabled={feedback !== null || feedbackLoading}
              className={`p-1.5 rounded transition-colors ${
                feedback === 'up'
                  ? 'bg-white/20 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-zinc-700'
              }`}
              title="Thumbs up"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(0)}
              disabled={feedback !== null || feedbackLoading}
              className={`p-1.5 rounded transition-colors ${
                feedback === 'down'
                  ? 'bg-red-600/30 text-red-400'
                  : 'text-gray-500 hover:text-white hover:bg-zinc-700'
              }`}
              title="Thumbs down"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
