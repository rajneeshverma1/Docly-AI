'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 2000;

export default function ChatInput({ onSend, disabled, placeholder = 'Ask anything about your documents...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const remaining = MAX_LENGTH - input.length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && input.length <= MAX_LENGTH) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-800 bg-black p-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-none bg-zinc-900 border-zinc-700 text-gray-200 placeholder:text-gray-600 focus-visible:ring-white pr-16"
            rows={1}
            disabled={disabled}
            maxLength={MAX_LENGTH}
          />
          <span className={`absolute bottom-2 right-2 text-xs ${remaining < 100 ? 'text-red-400' : 'text-gray-600'}`}>
            {remaining}
          </span>
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled || input.length > MAX_LENGTH}
          className="bg-white hover:bg-gray-200 text-black"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
