'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg text-white">Docly AI</span>
        </Link>
      </div>
    </header>
  );
}
