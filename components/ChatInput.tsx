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

export default function ChatInput({ onSend, disabled, placeholder = 'Ask anything about your documents...' }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
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
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none bg-zinc-900 border-zinc-700 text-gray-200 placeholder:text-gray-600 focus-visible:ring-white"
          rows={1}
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="bg-white hover:bg-gray-200 text-black"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
